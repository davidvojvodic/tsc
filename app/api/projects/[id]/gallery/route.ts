import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const galleryImageSchema = z.object({
  id: z.string().uuid(), // Add UUID format validation
  url: z.string().url(),
  ufsUrl: z.string().url().optional(),
  fileKey: z.string().min(1), // Ensure non-empty
  alt: z.string().nullable(),
  size: z.number().min(0).optional(), // Non-negative
  mimeType: z.string().optional(),
});

const gallerySchema = z.object({
  gallery: z.array(galleryImageSchema),
});

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = gallerySchema.parse(body);

    // Add duplicate ID checking
    const imageIds = validatedData.gallery.map(img => img.id);
    const uniqueIds = new Set(imageIds);
    if (imageIds.length !== uniqueIds.size) {
      return NextResponse.json(
        { error: "Duplicate image IDs detected" },
        { status: 400 }
      );
    }

    // Get current project gallery with full media details
    const currentProject = await prisma.project.findUnique({
      where: { id },
      select: {
        gallery: {
          include: {
            media: {
              select: {
                id: true,
                filename: true,
                url: true,
                mimeType: true,
                size: true,
                alt: true,
              },
            },
          },
        },
      },
    });

    if (!currentProject) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Smart gallery update algorithm with concurrency protection
    const project = await prisma.$transaction(
      async (tx) => {
        // CRITICAL: Lock project row to prevent concurrent modifications
        await tx.$executeRaw`SELECT id FROM project WHERE id = ${id} FOR UPDATE`;
        const incomingImages = validatedData.gallery;
        const existingGallery = currentProject.gallery;
        const existingMediaMap = new Map(
          existingGallery.map((g) => [g.media.id, g.media])
        );

        // Track operations for logging
        const operations = {
          preserved: [] as string[],
          updated: [] as string[],
          created: [] as string[],
          removed: [] as string[],
        };

        // Step 1: Process incoming images
        const processedMediaIds: string[] = [];

        for (const incomingImg of incomingImages) {
          const existingMedia = existingMediaMap.get(incomingImg.id);

          if (existingMedia) {
            // Check if any properties have changed
            const hasChanges =
              existingMedia.filename !== incomingImg.fileKey ||
              existingMedia.url !== (incomingImg.ufsUrl || incomingImg.url) ||
              existingMedia.mimeType !== (incomingImg.mimeType || "image/jpeg") ||
              existingMedia.size !== (incomingImg.size || 0) ||
              existingMedia.alt !== incomingImg.alt;

            if (hasChanges) {
              // Update existing media in-place to preserve ID and references
              await tx.media.update({
                where: { id: incomingImg.id },
                data: {
                  filename: incomingImg.fileKey,
                  url: incomingImg.ufsUrl || incomingImg.url,
                  mimeType: incomingImg.mimeType || "image/jpeg",
                  size: incomingImg.size || 0,
                  alt: incomingImg.alt,
                },
              });
              operations.updated.push(incomingImg.id);
            } else {
              // No changes - preserve existing record
              operations.preserved.push(incomingImg.id);
            }

            processedMediaIds.push(incomingImg.id);
          } else {
            // Create new media record
            const newMedia = await tx.media.create({
              data: {
                filename: incomingImg.fileKey,
                url: incomingImg.ufsUrl || incomingImg.url,
                type: MediaType.IMAGE,
                mimeType: incomingImg.mimeType || "image/jpeg",
                size: incomingImg.size || 0,
                alt: incomingImg.alt,
              },
            });

            operations.created.push(newMedia.id);
            processedMediaIds.push(newMedia.id);
          }
        }

        // Step 2: Identify media to remove (exist in DB but not in incoming data)
        const mediaToRemove = existingGallery
          .map((g) => g.media.id)
          .filter((mediaId) => !processedMediaIds.includes(mediaId));

        // Step 3: Clean up removed media
        if (mediaToRemove.length > 0) {
          // Remove gallery relations first
          await tx.projectToGallery.deleteMany({
            where: {
              projectId: id,
              mediaId: { in: mediaToRemove },
            },
          });

          // Use atomic operation with EXISTS subquery to prevent race conditions
          const deletedMedia = await tx.media.deleteMany({
            where: {
              id: { in: mediaToRemove },
              NOT: {
                activities: { some: {} }
              }
            }
          });
          operations.removed.push(...mediaToRemove.slice(0, deletedMedia.count));

          if (deletedMedia.count < mediaToRemove.length) {
            console.info(
              `[GALLERY_UPDATE] Preserved ${mediaToRemove.length - deletedMedia.count} media records from deletion due to activity references`
            );
          }
        }

        // Step 4: Rebuild gallery relations safely (create first, then remove)
        // Create new relations first (with duplicate protection)
        await tx.projectToGallery.createMany({
          data: processedMediaIds.map((mediaId) => ({
            projectId: id,
            mediaId: mediaId,
          })),
          skipDuplicates: true // Prevents duplicate key errors
        });

        // Then remove only the relations that are no longer needed
        await tx.projectToGallery.deleteMany({
          where: {
            projectId: id,
            mediaId: { notIn: processedMediaIds }
          }
        });

        // Log operations summary
        console.info(`[GALLERY_UPDATE] Operations summary:`, {
          projectId: id,
          preserved: operations.preserved.length,
          updated: operations.updated.length,
          created: operations.created.length,
          removed: operations.removed.length,
          totalProcessed: processedMediaIds.length,
        });

        // Return updated project
        return await tx.project.findUnique({
          where: { id },
          select: {
            id: true,
            gallery: {
              include: {
                media: {
                  select: {
                    id: true,
                    url: true,
                    filename: true,
                    alt: true,
                    mimeType: true,
                    size: true,
                  },
                },
              },
            },
          },
        });
      },
      {
        maxWait: 30000, // 30 seconds wait time
        timeout: 35000, // 35 seconds execution time
      }
    );

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }

    console.error("[PROJECT_GALLERY_PATCH]", error);

    let errorMessage = "Internal server error";

    if (error instanceof Error) {
      if (
        error.message.includes("Transaction already closed") ||
        error.message.includes("timeout")
      ) {
        errorMessage = "The operation took too long. Please try again.";
      } else if (error.message.includes("not found")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Server error: ${error.message}`;
      }
    }

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

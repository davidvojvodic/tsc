import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const galleryImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  ufsUrl: z.string().optional(),
  fileKey: z.string(),
  alt: z.string().nullable(),
  size: z.number().optional(),
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
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

    // Get current project gallery
    const currentProject = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        gallery: { select: { id: true } },
      },
    });

    if (!currentProject) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Update gallery
    const project = await prisma.$transaction(async (tx) => {
      // Delete old gallery images
      if (currentProject.gallery.length > 0) {
        await tx.media.deleteMany({
          where: {
            id: { in: currentProject.gallery.map(img => img.id) }
          }
        });
      }

      // Create new gallery images
      const newGalleryImages = await Promise.all(
        validatedData.gallery.map((img) =>
          tx.media.create({
            data: {
              filename: img.fileKey,
              url: img.ufsUrl || img.url,
              type: MediaType.IMAGE,
              mimeType: img.mimeType || "image/jpeg",
              size: img.size || 0,
              alt: img.alt,
            },
          })
        )
      );

      // Update project with new gallery
      return await tx.project.update({
        where: { id: params.id },
        data: {
          gallery: {
            set: newGalleryImages.map((img) => ({ id: img.id })),
          },
        },
        select: {
          id: true,
          gallery: {
            include: {
              media: {
                select: {
                  id: true,
                  url: true,
                  filename: true,
                },
              },
            },
          },
        },
      });
    }, {
      maxWait: 5000,
      timeout: 5000,
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    
    console.error("[PROJECT_GALLERY_PATCH]", error);
    
    let errorMessage = "Internal server error";
    
    if (error instanceof Error) {
      if (error.message.includes("Transaction already closed") || error.message.includes("timeout")) {
        errorMessage = "The operation took too long. Please try again.";
      } else if (error.message.includes("not found")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Server error: ${error.message}`;
      }
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
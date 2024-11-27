import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema Definitions
const heroImageSchema = z
  .object({
    url: z.string().url(),
    fileKey: z.string(),
  })
  .nullable();

const mediaSchema = z
  .object({
    url: z.string(),
    fileKey: z.string().optional(),
  })
  .nullable();

const timelinePhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  startDate: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return null;
  }, z.date().nullable()),
  endDate: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return null;
  }, z.date().nullable()),
  completed: z.boolean(),
  order: z.number(),
  media: mediaSchema,
});

const galleryImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  fileKey: z.string(),
  alt: z.string().nullable(),
});

const projectSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().nullable(),
    published: z.boolean(),
    featured: z.boolean(),
    heroImage: heroImageSchema,
  }),
  timeline: z.array(timelinePhaseSchema),
  gallery: z.array(galleryImageSchema),
  teacherIds: z.array(z.string()),
});

// Helper Functions
async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

// POST Route Handler
export async function POST(req: NextRequest) {
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
    const validatedData = projectSchema.parse(body);

    // Check if slug is unique
    const existingProject = await prisma.project.findUnique({
      where: { slug: validatedData.basicInfo.slug },
    });

    if (existingProject) {
      return new NextResponse("Slug already exists", { status: 400 });
    }

    // Create project with all related data
    const project = await prisma.$transaction(async (tx) => {
      // Create hero image if provided
      let heroImageId: string | undefined;
      if (validatedData.basicInfo.heroImage) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.basicInfo.heroImage.fileKey,
            url: validatedData.basicInfo.heroImage.url,
            type: MediaType.IMAGE,
            mimeType: "image/jpeg",
            size: 0,
          },
        });
        heroImageId = media.id;
      }

      // Create gallery images
      const galleryImages = await Promise.all(
        validatedData.gallery.map((img) =>
          tx.media.create({
            data: {
              filename: img.fileKey,
              url: img.url,
              type: MediaType.IMAGE,
              mimeType: "image/jpeg",
              size: 0,
              alt: img.alt,
            },
          })
        )
      );

      // Create the project
      const newProject = await tx.project.create({
        data: {
          name: validatedData.basicInfo.name,
          slug: validatedData.basicInfo.slug,
          description: validatedData.basicInfo.description,
          published: validatedData.basicInfo.published,
          featured: validatedData.basicInfo.featured,
          ...(heroImageId && { heroImageId }),
          gallery: {
            connect: galleryImages.map((img) => ({ id: img.id })),
          },
          teachers: {
            connect: validatedData.teacherIds.map((id) => ({ id })),
          },
        },
      });

      // Create timeline phases with media
      await Promise.all(
        validatedData.timeline.map(async (phase) => {
          let mediaId: string | undefined;

          if (phase.media) {
            const media = await tx.media.create({
              data: {
                filename: phase.media.fileKey || "unknown",
                url: phase.media.url,
                type: MediaType.IMAGE,
                mimeType: "image/jpeg",
                size: 0,
              },
            });
            mediaId = media.id;
          }

          return tx.projectPhase.create({
            data: {
              title: phase.title,
              description: phase.description,
              startDate: phase.startDate,
              endDate: phase.endDate,
              completed: phase.completed,
              order: phase.order,
              projectId: newProject.id,
              ...(mediaId ? { mediaId } : {}),
            },
          });
        })
      );

      return await tx.project.findUnique({
        where: { id: newProject.id },
        include: {
          heroImage: true,
          gallery: true,
          teachers: {
            include: {
              photo: true,
            },
          },
          timeline: {
            include: {
              media: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH Route Handler
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
    const validatedData = projectSchema.parse(body);

    // Check if slug is unique
    const existingProject = await prisma.project.findFirst({
      where: {
        slug: validatedData.basicInfo.slug,
        NOT: { id: params.id },
      },
    });

    if (existingProject) {
      return new NextResponse("Slug already exists", { status: 400 });
    }

    // Update project and all related data
    const project = await prisma.$transaction(async (tx) => {
      // Handle hero image
      let heroImageUpdate = {};
      if (validatedData.basicInfo.heroImage !== undefined) {
        const currentProject = await tx.project.findUnique({
          where: { id: params.id },
          select: { heroImage: true },
        });

        if (currentProject?.heroImage) {
          await tx.media.delete({
            where: { id: currentProject.heroImage.id },
          });
        }

        if (validatedData.basicInfo.heroImage) {
          const newHeroImage = await tx.media.create({
            data: {
              filename: validatedData.basicInfo.heroImage.fileKey,
              url: validatedData.basicInfo.heroImage.url,
              type: MediaType.IMAGE,
              mimeType: "image/jpeg",
              size: 0,
            },
          });
          heroImageUpdate = { heroImageId: newHeroImage.id };
        } else {
          heroImageUpdate = { heroImage: { disconnect: true } };
        }
      }

      // Update gallery
      await tx.media.deleteMany({
        where: {
          id: {
            in:
              (
                await tx.project.findUnique({
                  where: { id: params.id },
                  select: { gallery: { select: { id: true } } },
                })
              )?.gallery.map((img) => img.id) || [],
          },
        },
      });

      const newGalleryImages = await Promise.all(
        validatedData.gallery.map((img) =>
          tx.media.create({
            data: {
              filename: img.fileKey,
              url: img.url,
              type: MediaType.IMAGE,
              mimeType: "image/jpeg",
              size: 0,
              alt: img.alt,
            },
          })
        )
      );

      // Delete old timeline phases and their media
      const currentPhases = await tx.projectPhase.findMany({
        where: { projectId: params.id },
        include: { media: true },
      });

      for (const phase of currentPhases) {
        if (phase.media) {
          await tx.media.delete({ where: { id: phase.media.id } });
        }
      }
      await tx.projectPhase.deleteMany({ where: { projectId: params.id } });

      // Create new timeline phases with media
      await Promise.all(
        validatedData.timeline.map(async (phase) => {
          let mediaId: string | undefined;

          if (phase.media) {
            const media = await tx.media.create({
              data: {
                filename: phase.media.fileKey || "unknown",
                url: phase.media.url,
                type: MediaType.IMAGE,
                mimeType: "image/jpeg",
                size: 0,
              },
            });
            mediaId = media.id;
          }

          return tx.projectPhase.create({
            data: {
              title: phase.title,
              description: phase.description,
              startDate: phase.startDate,
              endDate: phase.endDate,
              completed: phase.completed,
              order: phase.order,
              projectId: params.id,
              ...(mediaId ? { mediaId } : {}),
            },
          });
        })
      );

      // Update the project with all new data
      return await tx.project.update({
        where: { id: params.id },
        data: {
          name: validatedData.basicInfo.name,
          slug: validatedData.basicInfo.slug,
          description: validatedData.basicInfo.description,
          published: validatedData.basicInfo.published,
          featured: validatedData.basicInfo.featured,
          ...heroImageUpdate,
          gallery: {
            connect: newGalleryImages.map((img) => ({ id: img.id })),
          },
          teachers: {
            set: validatedData.teacherIds.map((id) => ({ id })),
          },
        },
        include: {
          heroImage: true,
          gallery: true,
          teachers: {
            include: {
              photo: true,
            },
          },
          timeline: {
            include: {
              media: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[PROJECT_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE Route Handler
export async function DELETE(
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

    await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: params.id },
        include: {
          heroImage: true,
          gallery: true,
          timeline: {
            include: { media: true },
          },
        },
      });

      if (!project) return;

      // Delete all associated media
      if (project.heroImage) {
        await tx.media.delete({ where: { id: project.heroImage.id } });
      }

      for (const image of project.gallery) {
        await tx.media.delete({ where: { id: image.id } });
      }

      for (const phase of project.timeline) {
        if (phase.media) {
          await tx.media.delete({ where: { id: phase.media.id } });
        }
      }

      // Delete the project (will cascade delete phases)
      await tx.project.delete({ where: { id: params.id } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
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
    ufsUrl: z.string().url().optional(),
    fileKey: z.string(),
    size: z.number().optional(), // Optional in the schema validation but will default
    mimeType: z.string().optional(), // Optional in the schema validation but will default
  })
  .nullable();


const activitySchema = z.object({
  id: z.string(),
  title: z.string(),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),
  description: z.string(),
  description_sl: z.string().nullable(),
  description_hr: z.string().nullable(),
  order: z.number(),
  teacherIds: z.array(z.string()),
  imageIds: z.array(z.string()),
});

const timelinePhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),
  description: z.string(),
  description_sl: z.string().nullable(),
  description_hr: z.string().nullable(),
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
  activities: z.array(activitySchema).optional(),
});

const galleryImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  ufsUrl: z.string().optional(),
  fileKey: z.string(),
  alt: z.string().nullable(),
  size: z.number().optional(), // Optional in the schema validation but will default
  mimeType: z.string().optional(), // Optional in the schema validation but will default
});

const projectSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(1, "Name is required"),
    name_sl: z.string().nullable(),
    name_hr: z.string().nullable(),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().nullable(),
    description_sl: z.string().nullable(),
    description_hr: z.string().nullable(),
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

// Helper function to create a media record

// PATCH Route Handler
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
    const validatedData = projectSchema.parse(body);


    // Check if slug is unique
    const existingProject = await prisma.project.findFirst({
      where: {
        slug: validatedData.basicInfo.slug,
        NOT: { id },
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { message: "A project with this slug already exists. Please choose a different slug." },
        { status: 400 }
      );
    }

    // OPTIMIZED: Get current project data in one query
    const currentProject = await prisma.project.findUnique({
      where: { id },
      select: {
        heroImage: { select: { id: true } },
        gallery: { select: { id: true } },
      },
    });

    if (!currentProject) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Update project and all related data
    // Reduced timeout to fit within Vercel limits
    const project = await prisma.$transaction(async (tx) => {
      // Handle hero image
      let heroImageUpdate = {};
      if (validatedData.basicInfo.heroImage !== undefined) {
        // Use pre-fetched data instead of querying again
        if (currentProject.heroImage) {
          await tx.media.delete({
            where: { id: currentProject.heroImage.id },
          });
        }

        if (validatedData.basicInfo.heroImage) {
          const newHeroImage = await tx.media.create({
            data: {
              filename: validatedData.basicInfo.heroImage.fileKey,
              url:
                validatedData.basicInfo.heroImage.ufsUrl ||
                validatedData.basicInfo.heroImage.url,
              type: MediaType.IMAGE,
              mimeType:
                validatedData.basicInfo.heroImage.mimeType || "image/jpeg",
              size: validatedData.basicInfo.heroImage.size || 0,
            },
          });
          heroImageUpdate = { heroImageId: newHeroImage.id };
        } else {
          heroImageUpdate = { heroImage: { disconnect: true } };
        }
      }

      // Update gallery - use pre-fetched data and batch delete
      if (currentProject.gallery.length > 0) {
        await tx.media.deleteMany({
          where: {
            id: { in: currentProject.gallery.map(img => img.id) }
          }
        });
      }

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


      // Create a mapping from frontend image IDs (fileKeys) to database media IDs
      const imageIdMapping = new Map<string, string>();
      newGalleryImages.forEach(media => {
        imageIdMapping.set(media.filename, media.id);
      });

      // Phases no longer have media - images are only attached to activities
      
      // Delete old phases (activities will be cascade deleted)
      await tx.projectPhase.deleteMany({ where: { projectId: id } });
      
      // Create new timeline phases with activities
      await Promise.all(
        validatedData.timeline.map(async (phase) => {
          const createdPhase = await tx.projectPhase.create({
            data: {
              title: phase.title,
              title_sl: phase.title_sl,
              title_hr: phase.title_hr,
              startDate: phase.startDate,
              endDate: phase.endDate,
              completed: phase.completed,
              order: phase.order,
              projectId: id,
            },
          });

          // Create activities for this phase
          if (phase.activities && phase.activities.length > 0) {
            await Promise.all(
              phase.activities.map(async (activity) => {
                const createdActivity = await tx.projectActivity.create({
                  data: {
                    title: activity.title,
                    title_sl: activity.title_sl,
                    title_hr: activity.title_hr,
                    description: activity.description,
                    description_sl: activity.description_sl,
                    description_hr: activity.description_hr,
                    order: activity.order,
                    phaseId: createdPhase.id,
                  },
                });

                // Create teacher associations
                if (activity.teacherIds && activity.teacherIds.length > 0) {
                  await Promise.all(
                    activity.teacherIds.map(async (teacherId) => {
                      await tx.projectActivityToTeacher.create({
                        data: {
                          activityId: createdActivity.id,
                          teacherId: teacherId,
                        },
                      });
                    })
                  );
                }

                // Create image associations using the mapping
                if (activity.imageIds && activity.imageIds.length > 0) {
                  const validImageIds = activity.imageIds
                    .map(frontendId => imageIdMapping.get(frontendId))
                    .filter(Boolean) as string[];
                  
                  await Promise.all(
                    validImageIds.map(async (databaseImageId) => {
                      await tx.projectActivityToMedia.create({
                        data: {
                          activityId: createdActivity.id,
                          mediaId: databaseImageId,
                        },
                      });
                    })
                  );
                }
              })
            );
          }

          return createdPhase;
        })
      );

      // Phase media cleanup is no longer needed since phases don't have media
      
      // Update the project with all new data
      return await tx.project.update({
        where: { id },
        data: {
          name: validatedData.basicInfo.name,
          name_sl: validatedData.basicInfo.name_sl,
          name_hr: validatedData.basicInfo.name_hr,
          slug: validatedData.basicInfo.slug,
          description: validatedData.basicInfo.description,
          description_sl: validatedData.basicInfo.description_sl,
          description_hr: validatedData.basicInfo.description_hr,
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
          gallery: {
            include: {
              media: true,
            },
          },
          teachers: {
            include: {
              teacher: {
                include: {
                  photo: true,
                },
              },
            },
          },
          timeline: {
            include: {
              activities: {
                include: {
                  teachers: {
                    include: {
                      teacher: true,
                    },
                  },
                  images: {
                    include: {
                      media: true,
                    },
                  },
                },
                orderBy: {
                  order: "asc",
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    }, {
      maxWait: 9000, // Maximum time to wait for a transaction slot (9s)
      timeout: 9000, // Maximum time the transaction can run (9s to fit within Vercel's 10s limit)
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[PROJECT_PATCH]", error);
    
    // Provide more detailed error information
    let errorMessage = "Internal server error";
    
    if (error instanceof Error) {
      // Check for specific database errors
      if (error.message.includes("Transaction already closed") || error.message.includes("timeout")) {
        errorMessage = "The operation took too long to complete. This can happen with large projects. Please try again or contact support if the issue persists.";
      } else if (error.message.includes("foreign key constraint")) {
        errorMessage = "Invalid reference: One or more selected items (teacher, image) do not exist";
      } else if (error.message.includes("unique constraint")) {
        errorMessage = "A duplicate value was detected. Please check your input.";
      } else if (error.message.includes("not found")) {
        errorMessage = error.message;
      } else {
        // Include the actual error for debugging in development
        errorMessage = `Server error: ${error.message}`;
      }
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

// POST Route Handler
export async function POST(req: NextRequest) {
  try {
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
    const validatedData = projectSchema.parse(body);

    // Check if slug is unique
    const existingProject = await prisma.project.findUnique({
      where: { slug: validatedData.basicInfo.slug },
    });

    if (existingProject) {
      return NextResponse.json(
        { message: "A project with this slug already exists. Please choose a different slug." },
        { status: 400 }
      );
    }

    // Create project with all related data
    const project = await prisma.$transaction(async (tx) => {
      // Create hero image if provided
      let heroImageId: string | undefined;
      if (validatedData.basicInfo.heroImage) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.basicInfo.heroImage.fileKey,
            url:
              validatedData.basicInfo.heroImage.ufsUrl ||
              validatedData.basicInfo.heroImage.url,
            type: MediaType.IMAGE,
            mimeType:
              validatedData.basicInfo.heroImage.mimeType || "image/jpeg",
            size: validatedData.basicInfo.heroImage.size || 0,
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
              url: img.ufsUrl || img.url,
              type: MediaType.IMAGE,
              mimeType: img.mimeType || "image/jpeg",
              size: img.size || 0,
              alt: img.alt,
            },
          })
        )
      );

      // Create the project
      const newProject = await tx.project.create({
        data: {
          name: validatedData.basicInfo.name,
          name_sl: validatedData.basicInfo.name_sl,
          name_hr: validatedData.basicInfo.name_hr,
          slug: validatedData.basicInfo.slug,
          description: validatedData.basicInfo.description,
          description_sl: validatedData.basicInfo.description_sl,
          description_hr: validatedData.basicInfo.description_hr,
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

      // Create a mapping from frontend image IDs (fileKeys) to database media IDs
      const postImageIdMapping = new Map<string, string>();
      galleryImages.forEach(media => {
        postImageIdMapping.set(media.filename, media.id);
      });

      // Create timeline phases with activities
      await Promise.all(
        validatedData.timeline.map(async (phase) => {
          const createdPhase = await tx.projectPhase.create({
            data: {
              title: phase.title,
              title_sl: phase.title_sl || null,
              title_hr: phase.title_hr || null,
              startDate: phase.startDate,
              endDate: phase.endDate,
              completed: phase.completed,
              order: phase.order,
              projectId: newProject.id,
            },
          });

          // Create activities for this phase
          if (phase.activities && phase.activities.length > 0) {
            await Promise.all(
              phase.activities.map(async (activity) => {
                const createdActivity = await tx.projectActivity.create({
                  data: {
                    title: activity.title,
                    title_sl: activity.title_sl,
                    title_hr: activity.title_hr,
                    description: activity.description,
                    description_sl: activity.description_sl,
                    description_hr: activity.description_hr,
                    order: activity.order,
                    phaseId: createdPhase.id,
                  },
                });

                // Create teacher associations
                if (activity.teacherIds && activity.teacherIds.length > 0) {
                  await Promise.all(
                    activity.teacherIds.map(async (teacherId) => {
                      await tx.projectActivityToTeacher.create({
                        data: {
                          activityId: createdActivity.id,
                          teacherId: teacherId,
                        },
                      });
                    })
                  );
                }

                // Create image associations using the mapping
                if (activity.imageIds && activity.imageIds.length > 0) {
                  const validImageIds = activity.imageIds
                    .map(frontendId => postImageIdMapping.get(frontendId))
                    .filter(Boolean) as string[];
                  
                  await Promise.all(
                    validImageIds.map(async (databaseImageId) => {
                      await tx.projectActivityToMedia.create({
                        data: {
                          activityId: createdActivity.id,
                          mediaId: databaseImageId,
                        },
                      });
                    })
                  );
                }
              })
            );
          }

          return createdPhase;
        })
      );

      return await tx.project.findUnique({
        where: { id: newProject.id },
        include: {
          heroImage: true,
          gallery: {
            include: {
              media: true,
            },
          },
          teachers: {
            include: {
              teacher: {
                include: {
                  photo: true,
                },
              },
            },
          },
          timeline: {
            include: {
              activities: {
                include: {
                  teachers: {
                    include: {
                      teacher: true,
                    },
                  },
                  images: {
                    include: {
                      media: true,
                    },
                  },
                },
                orderBy: {
                  order: "asc",
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    }, {
      maxWait: 9000, // Maximum time to wait for a transaction slot (9s)
      timeout: 9000, // Maximum time the transaction can run (9s to fit within Vercel's 10s limit)
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[PROJECTS_POST]", error);
    
    // Provide more detailed error information
    let errorMessage = "Internal server error";
    
    if (error instanceof Error) {
      // Check for specific database errors
      if (error.message.includes("Transaction already closed") || error.message.includes("timeout")) {
        errorMessage = "The operation took too long to complete. This can happen with large projects. Please try again or contact support if the issue persists.";
      } else if (error.message.includes("foreign key constraint")) {
        errorMessage = "Invalid reference: One or more selected items (teacher, image) do not exist";
      } else if (error.message.includes("unique constraint")) {
        errorMessage = "A duplicate value was detected. Please check your input.";
      } else if (error.message.includes("not found")) {
        errorMessage = error.message;
      } else {
        // Include the actual error for debugging in development
        errorMessage = `Server error: ${error.message}`;
      }
    }

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE Route Handler
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
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
    console.log("Deleting project with ID:", projectId);

    // First, get the project with all its relations to make sure it exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true,
        heroImageId: true,
        gallery: {
          select: { id: true }
        },
        timeline: {
          select: { 
            id: true
          }
        }
      },
    });

    if (!project) {
      console.log("Project not found:", projectId);
      return new NextResponse("Project not found", { status: 404 });
    }

    // Create a simple transaction to handle all deletions in a safe order
    await prisma.$transaction(async (tx) => {
      console.log("Starting project deletion transaction");
      
      // 1. First, collect all media IDs to delete after other operations
      const mediaIds: string[] = [];
      
      // Add hero image if exists
      if (project.heroImageId) {
        console.log("Found hero image to delete:", project.heroImageId);
        mediaIds.push(project.heroImageId);
      }
      
      // Add gallery images
      if (project.gallery && project.gallery.length > 0) {
        console.log(`Found ${project.gallery.length} gallery images to delete`);
        project.gallery.forEach(img => mediaIds.push(img.id));
      }
      
      // Phases no longer have media - media is only attached to activities
      
      // 2. Delete project phases 
      console.log("Deleting project phases");
      await tx.projectPhase.deleteMany({
        where: { projectId }
      });
      
      // 3. Delete the project itself (this handles disconnecting relations)
      console.log("Deleting the project");
      await tx.project.delete({
        where: { id: projectId }
      });
      
      // 4. Now safely delete all media items
      if (mediaIds.length > 0) {
        console.log(`Deleting ${mediaIds.length} media items`);
        await tx.media.deleteMany({
          where: {
            id: { in: mediaIds }
          }
        });
      }
      
      console.log("Project deletion transaction completed successfully");
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    
    let errorMessage = "Failed to delete project";
    
    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint")) {
        errorMessage = "Cannot delete project: It is referenced by other data";
      } else {
        errorMessage = `Delete error: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
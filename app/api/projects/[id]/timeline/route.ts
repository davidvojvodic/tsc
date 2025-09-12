import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const orderedImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string().nullable(),
  order: z.number(),
});

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
  imageIds: z.array(z.string()).optional(), // Keep for backward compatibility
  orderedImages: z.array(orderedImageSchema).optional(), // New ordered images format
  materialIds: z.array(z.string()),
});

const timelinePhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),
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

const timelineSchema = z.object({
  timeline: z.array(timelinePhaseSchema),
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
    const validatedData = timelineSchema.parse(body);

    // Check if project exists and get gallery for image mapping
    const currentProject = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        gallery: {
          include: {
            media: {
              select: {
                id: true,
                filename: true,
              },
            },
          },
        },
      },
    });

    if (!currentProject) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Create mapping from frontend image IDs to database media IDs
    const imageIdMapping = new Map<string, string>();
    currentProject.gallery.forEach((item) => {
      // Map both the media ID and filename for compatibility
      imageIdMapping.set(item.media.id, item.media.id);
      if (item.media.filename) {
        imageIdMapping.set(item.media.filename, item.media.id);
      }
    });

    // Update timeline in chunks to avoid timeout
    const chunkSize = 2; // Process 2 phases at a time
    const timelineChunks = [];

    for (let i = 0; i < validatedData.timeline.length; i += chunkSize) {
      timelineChunks.push(validatedData.timeline.slice(i, i + chunkSize));
    }

    // First, delete all existing phases
    await prisma.projectPhase.deleteMany({
      where: { projectId: id },
    });

    // Process timeline in chunks
    for (const chunk of timelineChunks) {
      await prisma.$transaction(
        async (tx) => {
          for (const phase of chunk) {
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
              for (const activity of phase.activities) {
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

                // Handle image associations with proper ordering
                let imagesToProcess: Array<{ id: string; order: number }> = [];
                
                if (activity.orderedImages && activity.orderedImages.length > 0) {
                  // Use new orderedImages format
                  console.log(`[TIMELINE_API] Processing orderedImages for activity "${activity.title}":`, activity.orderedImages);
                  imagesToProcess = activity.orderedImages.map(img => ({
                    id: img.id,
                    order: img.order
                  }));
                } else if (activity.imageIds && activity.imageIds.length > 0) {
                  // Fallback to legacy imageIds format
                  console.log(`[TIMELINE_API] Processing legacy imageIds for activity "${activity.title}":`, activity.imageIds);
                  imagesToProcess = activity.imageIds.map((id, index) => ({
                    id,
                    order: index
                  }));
                }

                if (imagesToProcess.length > 0) {
                  console.log(`[TIMELINE_API] Image ID mapping:`, Array.from(imageIdMapping.entries()));
                  await Promise.all(
                    imagesToProcess.map(async (imageData) => {
                      // Map frontend image ID to database media ID
                      const databaseImageId = imageIdMapping.get(imageData.id);
                      console.log(`[TIMELINE_API] Mapping image ${imageData.id} -> ${databaseImageId}`);
                      if (databaseImageId) {
                        await tx.projectActivityToMedia.create({
                          data: {
                            activityId: createdActivity.id,
                            mediaId: databaseImageId,
                            order: imageData.order,
                          },
                        });
                      }
                    })
                  );
                }

                // Create material associations
                if (activity.materialIds && activity.materialIds.length > 0) {
                  await Promise.all(
                    activity.materialIds.map(async (materialId) => {
                      await tx.projectActivityToMaterial.create({
                        data: {
                          activityId: createdActivity.id,
                          materialId: materialId,
                        },
                      });
                    })
                  );
                }
              }
            }
          }
        },
        {
          maxWait: 30000, // 30 seconds wait time
          timeout: 50000, // 50 seconds execution time
        }
      );
    }

    // Return updated timeline
    const updatedProject = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
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
                  orderBy: {
                    order: "asc",
                  },
                },
                materials: {
                  include: {
                    material: {
                      select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true,
                        size: true,
                        language: true,
                      },
                    },
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

    return NextResponse.json(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }

    console.error("[PROJECT_TIMELINE_PATCH]", error);

    let errorMessage = "Internal server error";

    if (error instanceof Error) {
      if (
        error.message.includes("Transaction already closed") ||
        error.message.includes("timeout")
      ) {
        errorMessage =
          "The operation took too long. Try reducing the number of phases or activities.";
      } else if (error.message.includes("foreign key constraint")) {
        errorMessage =
          "Invalid reference: One or more selected items (teacher, image) do not exist";
      } else if (error.message.includes("not found")) {
        errorMessage = error.message;
      } else {
        errorMessage = `Server error: ${error.message}`;
      }
    }

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
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
                  orderBy: {
                    order: "asc",
                  },
                },
                materials: {
                  include: {
                    material: {
                      select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true,
                        size: true,
                        language: true,
                      },
                    },
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

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_TIMELINE_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

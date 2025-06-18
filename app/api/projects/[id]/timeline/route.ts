import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
    const validatedData = timelineSchema.parse(body);

    // Check if project exists and get gallery for image mapping
    const currentProject = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        gallery: {
          select: {
            id: true,
            filename: true,
          },
        },
      },
    });

    if (!currentProject) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Create mapping from frontend image IDs (fileKeys) to database media IDs
    const imageIdMapping = new Map<string, string>();
    currentProject.gallery.forEach(media => {
      imageIdMapping.set(media.filename, media.id);
    });

    // Update timeline in chunks to avoid timeout
    const chunkSize = 2; // Process 2 phases at a time
    const timelineChunks = [];
    
    for (let i = 0; i < validatedData.timeline.length; i += chunkSize) {
      timelineChunks.push(validatedData.timeline.slice(i, i + chunkSize));
    }

    // First, delete all existing phases
    await prisma.projectPhase.deleteMany({ 
      where: { projectId: params.id } 
    });

    // Process timeline in chunks
    for (const chunk of timelineChunks) {
      await prisma.$transaction(async (tx) => {
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
              projectId: params.id,
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
            }
          }
        }
      }, {
        maxWait: 8000,
        timeout: 8000,
      });
    }

    // Return updated timeline
    const updatedProject = await prisma.project.findUnique({
      where: { id: params.id },
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
      if (error.message.includes("Transaction already closed") || error.message.includes("timeout")) {
        errorMessage = "The operation took too long. Try reducing the number of phases or activities.";
      } else if (error.message.includes("foreign key constraint")) {
        errorMessage = "Invalid reference: One or more selected items (teacher, image) do not exist";
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
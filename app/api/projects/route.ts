import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

import prisma from "@/lib/prisma";

import { z } from "zod";

import { headers } from "next/headers";

import { MediaType } from "@prisma/client";

// Define schema for each part of the project

const heroImageSchema = z

  .object({
    url: z.string().url(),

    fileKey: z.string(),
  })

  .nullable();

// const mediaSchema = z

//   .object({

//     url: z.string(),

//     fileKey: z.string().optional(), // Make fileKey optional

//   })

//   .nullable();

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

  startDate: z.preprocess(
    (val) => (val ? new Date(val as string) : null),

    z.date().nullable().optional()
  ),

  endDate: z.preprocess(
    (val) => (val ? new Date(val as string) : null),

    z.date().nullable().optional()
  ),

  completed: z.boolean(),

  order: z.number(),

  activities: z.array(activitySchema).optional(),

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

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },

    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const take = parseInt(url.searchParams.get("take") || "50");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const featured = url.searchParams.get("featured") === "true";
    const published = url.searchParams.get("published") === "true";

    const projects = await prisma.project.findMany({
      take,
      skip,
      where: {
        ...(featured ? { featured: true } : {}),
        ...(published ? { published: true } : {}),
      },
      select: {
        id: true,
        name: true,
        name_sl: true,
        name_hr: true,
        slug: true,
        description: true,
        published: true,
        featured: true,
        heroImage: {
          select: {
            id: true,
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const total = await prisma.project.count({
      where: {
        ...(featured ? { featured: true } : {}),
        ...(published ? { published: true } : {}),
      },
    });

    return NextResponse.json({ projects, total });
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

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
            url: validatedData.basicInfo.heroImage.url,
            type: MediaType.IMAGE,
            mimeType: "image/jpeg",
            size: 0,
          },
        });

        heroImageId = media.id;
      }

      // Create gallery images
      // Create a mutable array to hold all gallery images
      // eslint-disable-next-line prefer-const
      let galleryImages = await Promise.all(
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

      // Create the project with all relations

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

          // Inside the project creation:

          timeline: {
            create: await Promise.all(validatedData.timeline.map(async (phase) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const phaseData: any = {
                title: phase.title,
                title_sl: phase.title_sl,
                title_hr: phase.title_hr,

                completed: phase.completed,

                order: phase.order,

                startDate: null, // Default to null

                endDate: null, // Default to null
              };

              // Only set dates if they exist
              if (phase.startDate) {
                phaseData.startDate = phase.startDate;
              }

              if (phase.endDate) {
                phaseData.endDate = phase.endDate;
              }

              // Create activities for this phase
              if (phase.activities && phase.activities.length > 0) {
                phaseData.activities = {
                  create: await Promise.all(
                    phase.activities.map(async (activity) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const activityData: any = {
                        title: activity.title,
                        title_sl: activity.title_sl,
                        title_hr: activity.title_hr,
                        description: activity.description,
                        description_sl: activity.description_sl,
                        description_hr: activity.description_hr,
                        order: activity.order,
                      };

                      // Create teacher associations
                      if (activity.teacherIds && activity.teacherIds.length > 0) {
                        activityData.teachers = {
                          create: activity.teacherIds.map((teacherId) => ({
                            teacherId: teacherId,
                          })),
                        };
                      }

                      // Create image associations using the mapping
                      if (activity.imageIds && activity.imageIds.length > 0) {
                        const routeImageIdMapping = new Map<string, string>();
                        galleryImages.forEach(media => {
                          routeImageIdMapping.set(media.filename, media.id);
                        });

                        const validImageIds = activity.imageIds
                          .map(frontendId => routeImageIdMapping.get(frontendId))
                          .filter(Boolean) as string[];
                        
                        if (validImageIds.length > 0) {
                          activityData.images = {
                            create: validImageIds.map((databaseImageId) => ({
                              mediaId: databaseImageId,
                            })),
                          };
                        }
                      }

                      return activityData;
                    })
                  ),
                };
              }

              return phaseData;
            })),
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

      return newProject;
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

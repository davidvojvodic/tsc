import { NextRequest, NextResponse } from "next/server";
import { MediaType } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { 
  projectCreateSchema
} from "@/lib/schemas/schema";
import { 
  validateAdminAuth, 
  createDetailedErrorResponse 
} from "@/lib/auth-utils";

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
    const { error } = await validateAdminAuth(req.headers);
    if (error) return error;

    const body = await req.json();
    const validatedData = projectCreateSchema.parse(body);

    // Check if slug is unique

    const existingProject = await prisma.project.findUnique({
      where: { slug: validatedData.basicInfo.slug },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          message:
            "A project with this slug already exists. Please choose a different slug.",
        },
        { status: 400 }
      );
    }

    // Create project with all related data in a single transaction
    const project = await prisma.$transaction(
      async (tx) => {
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
              create: galleryImages.map((img) => ({
                mediaId: img.id,
              })),
            },

            teachers: {
              create: validatedData.teacherIds.map((id) => ({
                teacherId: id,
              })),
            },

            timeline: {
              create: validatedData.timeline.map((phase) => ({
                title: phase.title,
                title_sl: phase.title_sl,
                title_hr: phase.title_hr,
                startDate: phase.startDate || null,
                endDate: phase.endDate || null,
                completed: phase.completed,
                order: phase.order,
                activities: phase.activities
                  ? {
                      create: phase.activities.map((activity) => {
                        const imageIdMapping = new Map<string, string>();
                        galleryImages.forEach((media) => {
                          imageIdMapping.set(media.filename, media.id);
                        });

                        const validImageIds =
                          (activity.imageIds
                            ?.map((frontendId) =>
                              imageIdMapping.get(frontendId)
                            )
                            .filter(Boolean) as string[]) || [];

                        return {
                          title: activity.title,
                          title_sl: activity.title_sl,
                          title_hr: activity.title_hr,
                          description: activity.description,
                          description_sl: activity.description_sl,
                          description_hr: activity.description_hr,
                          order: activity.order,
                          teachers: activity.teacherIds?.length
                            ? {
                                create: activity.teacherIds.map(
                                  (teacherId) => ({
                                    teacherId: teacherId,
                                  })
                                ),
                              }
                            : undefined,
                          images: validImageIds.length
                            ? {
                                create: validImageIds.map((mediaId) => ({
                                  mediaId: mediaId,
                                })),
                              }
                            : undefined,
                        };
                      }),
                    }
                  : undefined,
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
      },
      {
        maxWait: 30000, // 30 seconds wait time
        timeout: 50000, // 50 seconds execution time (well within 60s function limit)
      }
    );

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }

    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Failed to create project", { status: 500 });
  }
}

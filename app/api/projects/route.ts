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

const timelinePhaseSchema = z.object({
  id: z.string(),

  title: z.string(),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),

  description: z.string(),
  description_sl: z.string().nullable(),
  description_hr: z.string().nullable(),

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

  media: z.union([
    z.array(
      z.object({
        id: z.string(),
        url: z.string(),
        fileKey: z.string(),
        alt: z.string().nullable(),
      })
    ),
    z.object({
      url: z.string(),
      fileKey: z.string().optional(),
    }),
    z.null(),
  ]),
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

                description: phase.description,
                description_sl: phase.description_sl,
                description_hr: phase.description_hr,

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

              // Handle media if it exists (multiple images per phase)
              if (phase.media && Array.isArray(phase.media) && phase.media.length > 0) {
                console.log(`Processing phase with ${phase.media.length} media items`);
                
                const phaseMediaItems = [];
                
                // Create all media items for this phase
                for(let i = 0; i < phase.media.length; i++) {
                  const img = phase.media[i];
                  try {
                    const media = await tx.media.create({
                      data: {
                        filename: img.fileKey || img.id || "unknown",
                        url: img.url,
                        type: MediaType.IMAGE,
                        mimeType: "image/jpeg", 
                        size: 0,
                        alt: img.alt || null,
                      },
                    });
                    
                    // Add to phase media collection
                    phaseMediaItems.push(media);
                    
                    // Set the first image as the primary phase media 
                    if (i === 0) {
                      phaseData.mediaId = media.id;
                    }
                  } catch (error) {
                    console.error("Error creating phase media:", error);
                  }
                }
                
                // Handle additional images (beyond the primary one)
                if (phaseMediaItems.length > 1) {
                  // Store gallery connection data for all non-primary images
                  phaseData.gallery = {
                    connect: phaseMediaItems.slice(1).map(media => ({ id: media.id }))
                  };
                }
              }

              return phaseData;
            })),
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
              gallery: true,
            },

            orderBy: {
              order: "asc",
            },
          },
        },
      });

      return newProject;
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

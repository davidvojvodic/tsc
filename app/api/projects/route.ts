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
  description: z.string(),
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
  media: z
    .object({
      url: z.string(),
      fileKey: z.string().optional(),
    })
    .nullable(),
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

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
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

      // Create the project with all relations
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
          // Inside the project creation:
          timeline: {
            create: validatedData.timeline.map((phase) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const phaseData: any = {
                title: phase.title,
                description: phase.description,
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

              // Handle media if it exists
              if (phase.media) {
                phaseData.media = {
                  create: {
                    filename:
                      phase.media.fileKey ||
                      phase.media.url.split("/").pop() ||
                      "unknown",
                    url: phase.media.url,
                    type: MediaType.IMAGE,
                    mimeType: "image/jpeg",
                    size: 0,
                  },
                };
              }

              return phaseData;
            }),
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

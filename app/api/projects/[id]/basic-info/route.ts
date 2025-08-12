import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const heroImageSchema = z
  .object({
    url: z.string().url(),
    ufsUrl: z.string().url().optional(),
    fileKey: z.string(),
    size: z.number().optional(),
    mimeType: z.string().optional(),
  })
  .nullable();

const basicInfoSchema = z.object({
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
    const validatedData = basicInfoSchema.parse(body);

    // Check if slug is unique
    const existingProject = await prisma.project.findFirst({
      where: {
        slug: validatedData.slug,
        NOT: { id },
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { message: "A project with this slug already exists. Please choose a different slug." },
        { status: 400 }
      );
    }

    // Get current project
    const currentProject = await prisma.project.findUnique({
      where: { id },
      select: {
        heroImage: { select: { id: true } },
      },
    });

    if (!currentProject) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Update basic info and hero image
    const project = await prisma.$transaction(async (tx) => {
      // Handle hero image
      let heroImageUpdate = {};
      
      if (validatedData.heroImage !== undefined) {
        // Delete old hero image if exists
        if (currentProject.heroImage) {
          await tx.media.delete({
            where: { id: currentProject.heroImage.id },
          });
        }

        // Create new hero image
        if (validatedData.heroImage) {
          const newHeroImage = await tx.media.create({
            data: {
              filename: validatedData.heroImage.fileKey,
              url: validatedData.heroImage.ufsUrl || validatedData.heroImage.url,
              type: MediaType.IMAGE,
              mimeType: validatedData.heroImage.mimeType || "image/jpeg",
              size: validatedData.heroImage.size || 0,
            },
          });
          heroImageUpdate = { heroImageId: newHeroImage.id };
        } else {
          heroImageUpdate = { heroImage: { disconnect: true } };
        }
      }

      // Update the project basic info
      return await tx.project.update({
        where: { id },
        data: {
          name: validatedData.name,
          name_sl: validatedData.name_sl,
          name_hr: validatedData.name_hr,
          slug: validatedData.slug,
          description: validatedData.description,
          description_sl: validatedData.description_sl,
          description_hr: validatedData.description_hr,
          published: validatedData.published,
          featured: validatedData.featured,
          ...heroImageUpdate,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          published: true,
          featured: true,
          heroImage: {
            select: {
              id: true,
              url: true,
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
    
    console.error("[PROJECT_BASIC_INFO_PATCH]", error);
    
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
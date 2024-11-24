import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { projectSchema } from "@/lib/schemas/schema";
import { MediaType } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
    const validatedData = projectSchema.parse(body);

    // Check if slug is unique (excluding current project)
    const existingProject = await prisma.project.findFirst({
      where: {
        slug: validatedData.slug,
        NOT: { id: params.id },
      },
    });

    if (existingProject) {
      return new NextResponse("Slug already exists", { status: 400 });
    }

    // Update project with hero image if provided
    const project = await prisma.$transaction(async (tx) => {
      let heroImageUpdate = {};

      if (validatedData.heroImage) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.heroImage.fileKey,
            url: validatedData.heroImage.url,
            type: MediaType.IMAGE,
            mimeType: "image/jpeg",
            size: 0,
          },
        });
        heroImageUpdate = { heroImageId: media.id };
      }

      // If hero image is explicitly set to null, remove the reference
      if (validatedData.heroImage === null) {
        heroImageUpdate = { heroImage: { disconnect: true } };
      }

      // Get current project to handle hero image cleanup
      const currentProject = await tx.project.findUnique({
        where: { id: params.id },
        include: { heroImage: true },
      });

      // Delete old hero image if it's being replaced or removed
      if (currentProject?.heroImage && validatedData.heroImage !== undefined) {
        await tx.media.delete({
          where: { id: currentProject.heroImage.id },
        });
      }

      return await tx.project.update({
        where: { id: params.id },
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          description: validatedData.description,
          published: validatedData.published,
          featured: validatedData.featured,
          ...heroImageUpdate,
        },
        include: {
          heroImage: true,
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

    // Delete project and associated media in a transaction
    await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: params.id },
        include: { heroImage: true },
      });

      // Delete hero image if it exists
      if (project?.heroImage) {
        await tx.media.delete({
          where: { id: project.heroImage.id },
        });
      }

      // Delete the project
      await tx.project.delete({
        where: { id: params.id },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

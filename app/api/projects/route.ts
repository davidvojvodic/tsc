// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { MediaType } from "@prisma/client";
import { projectSchema } from "@/lib/schemas/schema";

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
      where: { slug: validatedData.slug },
    });

    if (existingProject) {
      return new NextResponse("Slug already exists", { status: 400 });
    }

    // Create project with hero image if provided
    const project = await prisma.$transaction(async (tx) => {
      let heroImageId: string | undefined;

      if (validatedData.heroImage) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.heroImage.fileKey,
            url: validatedData.heroImage.url,
            type: MediaType.IMAGE,
            mimeType: "image/jpeg", // You might want to make this dynamic
            size: 0, // You might want to store the actual size
          },
        });
        heroImageId = media.id;
      }

      return await tx.project.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          description: validatedData.description,
          published: validatedData.published,
          featured: validatedData.featured,
          ...(heroImageId && { heroImageId }),
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
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

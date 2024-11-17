// app/api/teachers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { MediaType } from "@prisma/client";

export const teacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional().nullable(),
  photo: z
    .object({
      url: z.string().url(),
      fileKey: z.string(),
      size: z.number(),
      mimeType: z.string(),
    })
    .optional()
    .nullable(),
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
    const validatedData = teacherSchema.parse(body);

    // Start a transaction to ensure data consistency
    const teacher = await prisma.$transaction(async (tx) => {
      let photoConnect = {};

      // If photo data is provided, create a Media record first
      if (validatedData.photo) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.photo.fileKey,
            url: validatedData.photo.url,
            mimeType: validatedData.photo.mimeType,
            size: validatedData.photo.size,
            type: MediaType.IMAGE,
          },
        });
        photoConnect = {
          photo: {
            connect: { id: media.id },
          },
        };
      }

      // Create the teacher with the media reference
      return await tx.teacher.create({
        data: {
          name: validatedData.name,
          bio: validatedData.bio,
          ...photoConnect,
        },
        include: {
          photo: true,
        },
      });
    });

    return NextResponse.json(teacher);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[TEACHERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

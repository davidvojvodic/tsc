import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";

import { MediaType } from "@prisma/client";
import { teacherSchema } from "@/lib/schemas/schema";

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
    const validatedData = teacherSchema.parse(body);

    const teacher = await prisma.$transaction(async (tx) => {
      let photoUpdate = {};

      // If photo data is provided, create a new Media record
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
        photoUpdate = {
          photo: {
            connect: { id: media.id },
          },
        };
      }

      // If photo is explicitly set to null, disconnect the existing photo
      if (validatedData.photo === null) {
        photoUpdate = {
          photo: {
            disconnect: true,
          },
        };
      }

      // Get the existing teacher to check for photo
      const existingTeacher = await tx.teacher.findUnique({
        where: { id: params.id },
        include: { photo: true },
      });

      // If there's an existing photo and we're updating to a new one,
      // delete the old photo
      if (existingTeacher?.photo && validatedData.photo) {
        await tx.media.delete({
          where: { id: existingTeacher.photo.id },
        });
      }

      // Update the teacher
      return await tx.teacher.update({
        where: { id: params.id },
        data: {
          name: validatedData.name,
          bio: validatedData.bio,
          ...photoUpdate,
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
    console.error("[TEACHER_PATCH]", error);
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

    // Delete the teacher and associated media in a transaction
    await prisma.$transaction(async (tx) => {
      // Get the teacher with their photo
      const teacher = await tx.teacher.findUnique({
        where: { id: params.id },
        include: { photo: true },
      });

      // If there's a photo, delete it
      if (teacher?.photo) {
        await tx.media.delete({
          where: { id: teacher.photo.id },
        });
      }

      // Delete the teacher
      await tx.teacher.delete({
        where: { id: params.id },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TEACHER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

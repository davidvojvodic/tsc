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

    const teacher = await prisma.$transaction(async (tx) => {
      let photoConnect = {};

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

      return await tx.teacher.create({
        data: {
          name: validatedData.name,
          title: validatedData.title,
          bio: validatedData.bio,
          email: validatedData.email,
          displayOrder: validatedData.displayOrder,
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

      // Handle photo removal
      if (validatedData.photo === null) {
        photoUpdate = {
          photo: {
            disconnect: true,
          },
        };
      }

      // Get existing teacher to handle photo cleanup
      const existingTeacher = await tx.teacher.findUnique({
        where: { id: params.id },
        include: { photo: true },
      });

      if (!existingTeacher) {
        throw new Error("Teacher not found");
      }

      // Delete old photo if being replaced or removed
      if (existingTeacher.photo && validatedData.photo !== undefined) {
        await tx.media.delete({
          where: { id: existingTeacher.photo.id },
        });
      }

      return await tx.teacher.update({
        where: { id: params.id },
        data: {
          name: validatedData.name,
          title: validatedData.title,
          bio: validatedData.bio,
          email: validatedData.email,
          displayOrder: validatedData.displayOrder,
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

    await prisma.$transaction(async (tx) => {
      const teacher = await tx.teacher.findUnique({
        where: { id: params.id },
        include: { photo: true },
      });

      if (teacher?.photo) {
        await tx.media.delete({
          where: { id: teacher.photo.id },
        });
      }

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

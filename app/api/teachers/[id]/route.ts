import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { MediaType } from "@prisma/client";

// Updated schema to support multiple languages with underscore notation
const teacherSchema = z.object({
  // Core fields (not language-specific)
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional()
    .nullable(),
  displayOrder: z.number().int().default(0),
  school: z.enum(["tsc", "pts"]).optional().nullable(),

  // Multilingual fields
  title: z
    .string()
    .max(100, { message: "Title cannot exceed 100 characters" })
    .optional()
    .nullable(),
  title_sl: z
    .string()
    .max(100, { message: "Title cannot exceed 100 characters" })
    .optional()
    .nullable(),
  title_hr: z
    .string()
    .max(100, { message: "Title cannot exceed 100 characters" })
    .optional()
    .nullable(),
  bio: z.string().optional().nullable(),
  bio_sl: z.string().optional().nullable(),
  bio_hr: z.string().optional().nullable(),

  photo: z
    .object({
      url: z.string().url(),
      fileKey: z.string(),
      size: z.number(),
      mimeType: z.string(),
    })
    .nullable()
    .optional(),
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
          title_sl: validatedData.title_sl,
          title_hr: validatedData.title_hr,
          bio: validatedData.bio,
          bio_sl: validatedData.bio_sl,
          bio_hr: validatedData.bio_hr,
          email: validatedData.email,
          displayOrder: validatedData.displayOrder,
          school: validatedData.school,
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
          title_sl: validatedData.title_sl,
          title_hr: validatedData.title_hr,
          bio: validatedData.bio,
          bio_sl: validatedData.bio_sl,
          bio_hr: validatedData.bio_hr,
          email: validatedData.email,
          displayOrder: validatedData.displayOrder,
          school: validatedData.school,
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

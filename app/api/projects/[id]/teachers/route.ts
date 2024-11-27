// app/api/projects/[projectId]/teachers/route.ts
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const teacherSchema = z.object({
  teacherId: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { teacherId } = teacherSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: {
        id: params.id,
      },
      data: {
        teachers: {
          connect: {
            id: teacherId,
          },
        },
      },
      include: {
        teachers: {
          include: {
            photo: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProject.teachers);
  } catch (error) {
    console.error("[TEACHER_ASSIGN]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { teacherId } = teacherSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: {
        id: params.id,
      },
      data: {
        teachers: {
          disconnect: {
            id: teacherId,
          },
        },
      },
      include: {
        teachers: {
          include: {
            photo: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProject.teachers);
  } catch (error) {
    console.error("[TEACHER_REMOVE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

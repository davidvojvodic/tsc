import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const teachersSchema = z.object({
  teacherIds: z.array(z.string()),
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
    const validatedData = teachersSchema.parse(body);

    // Check if project exists
    const projectExists = await prisma.project.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!projectExists) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Update teachers
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        teachers: {
          set: validatedData.teacherIds.map((id) => ({ id })),
        },
      },
      select: {
        id: true,
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                title: true,
                title_sl: true,
                title_hr: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    
    console.error("[PROJECT_TEACHERS_PATCH]", error);
    
    let errorMessage = "Internal server error";
    
    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint")) {
        errorMessage = "One or more teacher IDs are invalid";
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
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  projectUpdateTeachersSchema 
} from "@/lib/schemas/schema";
import { 
  validateAdminAuth, 
  createDetailedErrorResponse 
} from "@/lib/auth-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await validateAdminAuth(req.headers);
    if (error) return error;

    const body = await req.json();
    const validatedData = projectUpdateTeachersSchema.parse(body);

    // Check if project exists
    const projectExists = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!projectExists) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Update teachers using transaction
    const project = await prisma.$transaction(async (tx) => {
      // Delete existing teacher relations
      await tx.teacherToProject.deleteMany({
        where: { projectId: id },
      });

      // Create new teacher relations
      await tx.teacherToProject.createMany({
        data: validatedData.teacherIds.map((teacherId) => ({
          projectId: id,
          teacherId: teacherId,
        })),
      });

      // Return updated project with teachers
      return await tx.project.findUnique({
        where: { id },
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
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    
    console.error("[PROJECT_TEACHERS_PATCH]", error);
    return new NextResponse("Failed to update project teachers", { status: 500 });
  }
}
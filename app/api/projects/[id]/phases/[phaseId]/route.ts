import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { projectPhaseSchema } from "@/lib/schemas/schema";
import { checkAdminAccess } from "@/lib/utils";
import { MediaType } from "@prisma/client";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; phaseId: string } }
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
    const validatedData = projectPhaseSchema.parse(body);

    const phase = await prisma.$transaction(async (tx) => {
      let mediaUpdate = {};

      if (validatedData.media) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.media.fileKey,
            url: validatedData.media.url,
            type: MediaType.IMAGE,
            mimeType: "image/jpeg",
            size: 0,
          },
        });
        mediaUpdate = { mediaId: media.id };
      }

      // If media is explicitly set to null, remove the reference
      if (validatedData.media === null) {
        mediaUpdate = { media: { disconnect: true } };
      }

      // Get current phase to handle media cleanup
      const currentPhase = await tx.projectPhase.findUnique({
        where: { id: params.phaseId },
        include: { media: true },
      });

      // Delete old media if it's being replaced or removed
      if (currentPhase?.media && validatedData.media !== undefined) {
        await tx.media.delete({
          where: { id: currentPhase.media.id },
        });
      }

      return await tx.projectPhase.update({
        where: { id: params.phaseId },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          startDate: new Date(validatedData.startDate),
          endDate: validatedData.endDate
            ? new Date(validatedData.endDate)
            : null,
          completed: validatedData.completed,
          order: validatedData.order,
          ...mediaUpdate,
        },
        include: {
          media: true,
        },
      });
    });

    return NextResponse.json(phase);
  } catch (error) {
    console.error("[PHASE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; phaseId: string } }
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
      const phase = await tx.projectPhase.findUnique({
        where: { id: params.phaseId },
        include: { media: true },
      });

      if (phase?.media) {
        await tx.media.delete({
          where: { id: phase.media.id },
        });
      }

      await tx.projectPhase.delete({
        where: { id: params.phaseId },
      });

      // Reorder remaining phases
      const remainingPhases = await tx.projectPhase.findMany({
        where: { projectId: params.projectId },
        orderBy: { order: "asc" },
      });

      for (let i = 0; i < remainingPhases.length; i++) {
        await tx.projectPhase.update({
          where: { id: remainingPhases[i].id },
          data: { order: i },
        });
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PHASE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

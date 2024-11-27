import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { projectPhaseSchema } from "@/lib/schemas/schema";
import { MediaType } from "@prisma/client";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export async function POST(
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
    const validatedData = projectPhaseSchema.parse(body);

    const phase = await prisma.$transaction(async (tx) => {
      let mediaId: string | undefined;

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
        mediaId = media.id;
      }

      // Get the highest order number
      const lastPhase = await tx.projectPhase.findFirst({
        where: { projectId: params.id },
        orderBy: { order: "desc" },
      });

      const order = lastPhase ? lastPhase.order + 1 : 0;

      return await tx.projectPhase.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          startDate: new Date(validatedData.startDate),
          endDate: validatedData.endDate
            ? new Date(validatedData.endDate)
            : null,
          completed: validatedData.completed,
          order,
          projectId: params.id,
          ...(mediaId && { mediaId }),
        },
        include: {
          media: true,
        },
      });
    });

    return NextResponse.json(phase);
  } catch (error) {
    console.error("[PHASE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const phases = await prisma.projectPhase.findMany({
      where: { projectId: params.id },
      include: { media: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(phases);
  } catch (error) {
    console.error("[PHASES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

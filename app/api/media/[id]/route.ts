// app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
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

    // Check if the media is in use
    const media = await prisma.media.findUnique({
      where: { id: params.id },
      include: {
        posts: true,
        pages: true,
        teachers: true,
        projectHero: true,
        projectGallery: true,
        primaryForPhases: true,
        phaseGalleries: true,
        testimonials: true,
      },
    });

    if (!media) {
      return new NextResponse("Media not found", { status: 404 });
    }

    // Check if the media is being used
    const isInUse = 
      media.posts.length > 0 ||
      media.pages.length > 0 ||
      media.teachers.length > 0 ||
      media.projectHero.length > 0 ||
      media.projectGallery.length > 0 ||
      media.primaryForPhases.length > 0 ||
      media.phaseGalleries.length > 0 ||
      media.testimonials.length > 0;

    if (isInUse) {
      return new NextResponse(
        "Cannot delete media that is in use", 
        { status: 400 }
      );
    }

    // Delete the media
    await prisma.media.delete({
      where: { id: params.id },
    });

    // TODO: You might want to also delete the file from uploadthing here
    // This would require using their API to delete files

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[MEDIA_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
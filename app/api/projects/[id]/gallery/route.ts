// app/api/projects/[id]/gallery/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MediaType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const images = Array.isArray(body) ? body : [body]; // Handle both single and multiple images

    const createdImages = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const { url, fileKey, alt } of images) {
        // Create the media record
        const media = await tx.media.create({
          data: {
            filename: fileKey,
            url: url,
            type: MediaType.IMAGE,
            mimeType: "image/jpeg",
            size: 0,
            alt: alt || null,
          },
        });

        // Connect it to the project
        await tx.project.update({
          where: { id: params.id },
          data: {
            gallery: {
              connect: { id: media.id },
            },
          },
        });

        results.push(media);
      }

      return results;
    });

    return NextResponse.json(createdImages);
  } catch (error) {
    console.error("[GALLERY_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Add PATCH route for updating alt text
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const body = await req.json();
    const { alt } = body;

    const updatedMedia = await prisma.media.update({
      where: { id: params.imageId },
      data: { alt: alt || null },
    });

    return NextResponse.json(updatedMedia);
  } catch (error) {
    console.error("[GALLERY_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

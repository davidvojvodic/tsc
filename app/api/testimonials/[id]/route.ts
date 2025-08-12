// app/api/testimonials/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { MediaType } from "@prisma/client";

const testimonialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  role: z.string().min(2, "Role must be at least 2 characters long"),
  role_sl: z.string().optional(),
  role_hr: z.string().optional(),
  content: z.string().min(10, "Testimonial must be at least 10 characters long"),
  content_sl: z.string().optional(),
  content_hr: z.string().optional(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  photo: z
    .object({
      url: z.string().url(),
      fileKey: z.string(),
    })
    .optional()
    .nullable(),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = testimonialSchema.parse(body);

    const testimonial = await prisma.$transaction(async (tx) => {
      let photoUpdate = {};

      if (validatedData.photo) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.photo.fileKey,
            url: validatedData.photo.url,
            type: MediaType.IMAGE,
            mimeType: "image/jpeg",
            size: 0,
          },
        });
        photoUpdate = { photo: { connect: { id: media.id } } };
      }

      // If photo is explicitly set to null, disconnect the existing photo
      if (validatedData.photo === null) {
        photoUpdate = { photo: { disconnect: true } };
      }

      // Get the existing testimonial to check for photo
      const existingTestimonial = await tx.testimonial.findUnique({
        where: { id },
        include: { photo: true },
      });

      // If there's an existing photo and we're updating to a new one,
      // delete the old photo
      if (existingTestimonial?.photo && validatedData.photo) {
        await tx.media.delete({
          where: { id: existingTestimonial.photo.id },
        });
      }

      // Update the testimonial
      return await tx.testimonial.update({
        where: { id },
        data: {
          name: validatedData.name,
          role: validatedData.role,
          role_sl: validatedData.role_sl,
          role_hr: validatedData.role_hr,
          content: validatedData.content,
          content_sl: validatedData.content_sl,
          content_hr: validatedData.content_hr,
          published: validatedData.published,
          featured: validatedData.featured,
          ...photoUpdate,
        },
        include: {
          photo: true,
        },
      });
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[TESTIMONIAL_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete the testimonial and associated media in a transaction
    await prisma.$transaction(async (tx) => {
      const testimonial = await tx.testimonial.findUnique({
        where: { id },
        include: { photo: true },
      });

      // If there's a photo, delete it
      if (testimonial?.photo) {
        await tx.media.delete({
          where: { id: testimonial.photo.id },
        });
      }

      // Delete the testimonial
      await tx.testimonial.delete({
        where: { id },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TESTIMONIAL_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
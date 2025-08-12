// app/api/testimonials/route.ts
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

export async function POST(req: NextRequest) {
  try {
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

    // Start a transaction to ensure data consistency
    const testimonial = await prisma.$transaction(async (tx) => {
      let photoConnect = {};

      // If photo data is provided, create a Media record first
      if (validatedData.photo) {
        const media = await tx.media.create({
          data: {
            filename: validatedData.photo.fileKey,
            url: validatedData.photo.url,
            mimeType: "image/jpeg", // Assuming JPEG, adjust if needed
            size: 0, // Size could be added if needed
            type: MediaType.IMAGE,
          },
        });
        photoConnect = {
          photo: {
            connect: { id: media.id },
          },
        };
      }

      // Create the testimonial with the media reference
      return await tx.testimonial.create({
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
          ...photoConnect,
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
    console.error("[TESTIMONIALS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET() {
  try {
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

    const testimonials = await prisma.testimonial.findMany({
      include: {
        photo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("[TESTIMONIALS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
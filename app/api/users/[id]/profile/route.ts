// app/api/users/[id]/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(30, "Name must not be longer than 30 characters.")
    .optional(),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Invalid email address.")
    .optional(),
  image: z.string().url().nullable().optional(),
});

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

    // Check if user is updating their own profile
    if (session.user.id !== id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = profileSchema.parse(body);

    // Check if email is already taken
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: {
            id,
          },
        },
      });

      if (existingUser) {
        return new NextResponse("Email already in use", { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...validatedData,
        // Set emailVerified to false if email is changed
        ...(validatedData.email && validatedData.email !== session.user.email
          ? { emailVerified: false }
          : {}),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }

    console.error("[PROFILE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

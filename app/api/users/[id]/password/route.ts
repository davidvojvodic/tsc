// app/api/users/[id]/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { z } from "zod";
import { hash, compare } from "bcrypt";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(
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

    // Check if user is updating their own password
    if (session.user.id !== id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = passwordSchema.parse(body);

    // Get user's current password from account
    const account = await prisma.account.findFirst({
      where: {
        userId: id,
        providerId: "credentials",
      },
    });

    if (!account?.password) {
      return new NextResponse("No password set", { status: 400 });
    }

    // Verify current password
    const isValid = await compare(
      validatedData.currentPassword,
      account.password
    );

    if (!isValid) {
      return new NextResponse("Current password is incorrect", { status: 400 });
    }

    // Hash and update new password
    const hashedPassword = await hash(validatedData.newPassword, 10);

    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }

    console.error("[PASSWORD_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

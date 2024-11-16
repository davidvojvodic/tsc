// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { hash } from "bcrypt";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "USER", "TEACHER"]),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  emailVerified: z.boolean(),
});

type UpdateUserData = Omit<z.infer<typeof updateUserSchema>, "password">;

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
    const validatedData = updateUserSchema.parse(body);

    // Check if email is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        NOT: {
          id: params.id,
        },
      },
    });

    if (existingUser) {
      return new NextResponse("Email already in use", { status: 400 });
    }

    // Build the update data with proper typing
    const updateData: UpdateUserData = {
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
      emailVerified: validatedData.emailVerified,
    };

    // If password is provided, update the account
    if (validatedData.password) {
      const hashedPassword = await hash(validatedData.password, 10);
      await prisma.account.upsert({
        where: {
          id: await prisma.account
            .findFirst({
              where: {
                userId: params.id,
                providerId: "credentials",
              },
              select: { id: true },
            })
            .then((account) => account?.id || ""),
        },
        update: {
          password: hashedPassword,
        },
        create: {
          userId: params.id,
          providerId: "credentials",
          accountId: validatedData.email,
          password: hashedPassword,
        },
      });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[USER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
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

    // Prevent deleting the last admin user
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true },
    });

    if (user?.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return new NextResponse("Cannot delete the last admin user", {
          status: 400,
        });
      }
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

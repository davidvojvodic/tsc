import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "USER", "TEACHER"]),
  password: z
    .string()
    .min(12, { message: "Password must be at least 12 characters long" })
    .max(128, { message: "Password cannot exceed 128 characters" })
    .refine((password) => {
      // Check for at least one uppercase letter
      if (!/[A-Z]/.test(password)) {
        return false;
      }
      // Check for at least one lowercase letter
      if (!/[a-z]/.test(password)) {
        return false;
      }
      // Check for at least one number
      if (!/[0-9]/.test(password)) {
        return false;
      }
      // Check for at least one special character
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return false;
      }
      return true;
    }, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    })
    .optional(),
  emailVerified: z.boolean().default(false),
});

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
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
    const validatedData = userSchema.parse(body);

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return new NextResponse("Email already in use", { status: 400 });
    }

    try {
      // Use Better Auth's admin plugin to create user with secure password handling
      if (!validatedData.password) {
        return new NextResponse("Password is required for user creation", { status: 400 });
      }

      const createUserResult = await auth.api.createUser({
        body: {
          email: validatedData.email,
          password: validatedData.password, // Better Auth will securely hash this
          name: validatedData.name,
        },
        headers: await headers(),
      });

      if (!createUserResult?.user) {
        throw new Error("Failed to create user via Better Auth admin plugin");
      }

      // Update the user with admin-specific fields (role, emailVerified)
      const updatedUser = await prisma.user.update({
        where: { id: createUserResult.user.id },
        data: {
          role: validatedData.role,
          emailVerified: validatedData.emailVerified,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Return sanitized user data (no password info)
      return NextResponse.json(updatedUser);

    } catch (betterAuthError: unknown) {
      console.error("[BETTER_AUTH_CREATE_USER]", betterAuthError);
      
      // Handle Better Auth specific errors
      const errorMessage = betterAuthError instanceof Error ? betterAuthError.message : String(betterAuthError);
      if (errorMessage.includes("email already exists")) {
        return new NextResponse("Email already in use", { status: 400 });
      }
      if (errorMessage.includes("invalid email")) {
        return new NextResponse("Invalid email address", { status: 400 });
      }
      if (errorMessage.includes("password")) {
        return new NextResponse("Password requirements not met", { status: 400 });
      }
      
      throw betterAuthError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues }, 
        { status: 422 }
      );
    }
    console.error("[USERS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

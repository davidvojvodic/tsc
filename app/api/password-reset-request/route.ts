import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must be less than 500 characters"),
});

// Submit password reset request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, reason } = requestPasswordResetSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ 
        message: "If a user with this email exists, a password reset request will be submitted for admin review." 
      });
    }

    // Check for existing pending request in the last 24 hours
    const existingRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
        requestedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending password reset request. Please wait for admin approval or try again in 24 hours." },
        { status: 429 }
      );
    }

    // Create password reset request with 7 days expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        reason,
        expiresAt,
      },
    });

    return NextResponse.json({
      message: "Password reset request submitted successfully. An administrator will review your request and contact you via email.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check status of own password reset request
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.passwordResetRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: "desc" },
      take: 5, // Last 5 requests
      select: {
        id: true,
        status: true,
        reason: true,
        requestedAt: true,
        processedAt: true,
        adminNotes: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching password reset requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
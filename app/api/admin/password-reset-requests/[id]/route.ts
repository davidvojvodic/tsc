import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNotes: z.string().optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  adminNotes: z.string().optional(),
});

// Update password reset request status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, adminNotes } = updateRequestSchema.parse(body);

    // Check if request exists and is still pending
    const request_record = await prisma.passwordResetRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!request_record) {
      return NextResponse.json(
        { error: "Password reset request not found" },
        { status: 404 }
      );
    }

    if (request_record.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request has already been processed" },
        { status: 400 }
      );
    }

    // Check if request has expired
    if (request_record.expiresAt < new Date()) {
      await prisma.passwordResetRequest.update({
        where: { id: id },
        data: { status: "EXPIRED" },
      });
      
      return NextResponse.json(
        { error: "Request has expired" },
        { status: 400 }
      );
    }

    // Update request status
    const updatedRequest = await prisma.passwordResetRequest.update({
      where: { id: id },
      data: {
        status,
        adminNotes,
        processedAt: new Date(),
        processedBy: session.user.id,
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    // No email notifications - admin will contact user directly

    return NextResponse.json({
      message: `Request ${status.toLowerCase()} successfully`,
      request: updatedRequest,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating password reset request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Reset user password (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { newPassword, adminNotes } = resetPasswordSchema.parse(body);

    // Check if request exists and is approved
    const request_record = await prisma.passwordResetRequest.findUnique({
      where: { id: id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!request_record) {
      return NextResponse.json(
        { error: "Password reset request not found" },
        { status: 404 }
      );
    }

    if (!["PENDING", "APPROVED"].includes(request_record.status)) {
      return NextResponse.json(
        { error: "Request must be pending or approved to reset password" },
        { status: 400 }
      );
    }

    // Use the proven temporary user approach to get correct password hash
    try {
      const tempEmail = `temp-${Date.now()}@internal.temp`;
      
      // Create temporary user with the desired password using Better Auth
      const tempUserResult = await auth.api.signUpEmail({
        body: {
          email: tempEmail,
          password: newPassword,
          name: "TempUser"
        }
      });

      if (!tempUserResult) {
        throw new Error("Failed to create temporary user");
      }

      // Get the hashed password from the temporary user's account
      const tempAccount = await prisma.account.findFirst({
        where: {
          userId: tempUserResult.user.id
        }
      });

      if (!tempAccount?.password) {
        throw new Error("Could not get password hash from temporary account");
      }

      // Find the target user's account
      const targetAccount = await prisma.account.findFirst({
        where: {
          userId: request_record.user.id,
          password: { not: null }
        }
      });

      if (!targetAccount) {
        throw new Error("No password account found for target user");
      }

      // Update the target user's password with the correctly hashed password
      await prisma.account.update({
        where: { id: targetAccount.id },
        data: { password: tempAccount.password }
      });

      // Clean up: delete the temporary user
      await prisma.user.delete({
        where: { id: tempUserResult.user.id }
      });
    } catch (error) {
      console.error("Error setting user password:", error);
      return NextResponse.json(
        { error: "Failed to update user password", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }

    // Mark request as completed
    await prisma.passwordResetRequest.update({
      where: { id: id },
      data: {
        status: "COMPLETED",
        adminNotes: adminNotes || "Password reset completed by administrator",
        processedAt: new Date(),
        processedBy: session.user.id,
      },
    });

    return NextResponse.json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
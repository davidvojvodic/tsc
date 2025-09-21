import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED", "EXPIRED"]).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional(),
  search: z.string().optional(),
});

// Type for Prisma where clause
type PasswordResetRequestWhereInput = {
  status?: string;
  OR?: Array<{
    user?: {
      email?: { contains: string; mode: "insensitive" };
      name?: { contains: string; mode: "insensitive" };
    };
    reason?: { contains: string; mode: "insensitive" };
  }>;
};

// Type for request with user data
type PasswordResetRequestWithUser = {
  id: string;
  userId: string;
  status: string;
  reason: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  adminNotes: string | null;
  expiresAt: Date;
  User: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  };
};

// List all password reset requests (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const { status, page = 1, limit = 20, search } = querySchema.parse({
      status: url.searchParams.get("status"),
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search"),
    });

    const skip = (page - 1) * limit;

    // Build where clause
    const where: PasswordResetRequestWhereInput = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          user: {
            email: { contains: search, mode: "insensitive" },
          },
        },
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          reason: { contains: search, mode: "insensitive" },
        },
      ];
    }

    // Get total count for pagination
    const total = await prisma.passwordResetRequest.count({ where });

    // Fetch requests with user data
    const requests = await prisma.passwordResetRequest.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
      skip,
      take: limit,
    });

    // Update expired requests
    const now = new Date();
    const expiredIds = requests
      .filter((req: PasswordResetRequestWithUser) => req.status === "PENDING" && req.expiresAt < now)
      .map((req: PasswordResetRequestWithUser) => req.id);

    if (expiredIds.length > 0) {
      await prisma.passwordResetRequest.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "EXPIRED" },
      });
      
      // Update the status in the response
      requests.forEach((req: PasswordResetRequestWithUser) => {
        if (expiredIds.includes(req.id)) {
          req.status = "EXPIRED";
        }
      });
    }

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error fetching password reset requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
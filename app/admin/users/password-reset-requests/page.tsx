import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { PasswordResetRequestClient } from "./components/password-reset-request-client";

// Type for the password reset request with user data from Prisma
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

export default async function AdminPasswordResetRequestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Verify admin access
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  // First, clean up orphaned password reset requests (requests without valid users)
  // Get all userIds that exist in the User table
  const existingUsers = await prisma.user.findMany({
    select: { id: true },
  });
  const existingUserIds = existingUsers.map(user => user.id);
  
  // Delete password reset requests that reference non-existent users
  await prisma.passwordResetRequest.deleteMany({
    where: {
      userId: {
        notIn: existingUserIds,
      },
    },
  });

  // Fetch password reset requests with user data (only valid ones remain)
  const requests = await prisma.passwordResetRequest.findMany({
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
  }

  const formattedRequests = requests.map((request: PasswordResetRequestWithUser) => ({
    id: request.id,
    userId: request.userId,
    userEmail: request.User.email,
    userName: request.User.name || "Unknown User",
    status: expiredIds.includes(request.id) ? "EXPIRED" : request.status,
    reason: request.reason,
    requestedAt: format(request.requestedAt, "MMM do, yyyy 'at' h:mm a"),
    processedAt: request.processedAt ? format(request.processedAt, "MMM do, yyyy 'at' h:mm a") : null,
    adminNotes: request.adminNotes,
    expiresAt: format(request.expiresAt, "MMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <PasswordResetRequestClient data={formattedRequests} />
      </div>
    </div>
  );
}
// app/admin/contact/page.tsx
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { ContactClient } from "./components/client";

export default async function ContactPage() {
  const submissions = await prisma.contactSubmission.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedSubmissions = submissions.map((submission) => ({
    id: submission.id,
    name: submission.name || "Anonymous",
    email: submission.email,
    message: submission.message.length > 100
      ? submission.message.substring(0, 100) + "..."
      : submission.message,
    fullMessage: submission.message,
    status: submission.status,
    userId: submission.userId,
    userName: submission.user?.name || null,
    userEmail: submission.user?.email || null,
    createdAt: format(submission.createdAt, "MMM dd, yyyy HH:mm"),
    updatedAt: format(submission.updatedAt, "MMM dd, yyyy HH:mm"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ContactClient data={formattedSubmissions} />
      </div>
    </div>
  );
}
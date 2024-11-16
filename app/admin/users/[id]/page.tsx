import prisma from "@/lib/prisma";
import { UserForm } from "@/components/forms/user-form";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function UserPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Verify admin access
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  // For edit mode, fetch the user
  const user =
    params.id !== "new"
      ? await prisma.user.findUnique({
          where: { id: params.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
          },
        })
      : null;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UserForm initialData={user || undefined} />
      </div>
    </div>
  );
}

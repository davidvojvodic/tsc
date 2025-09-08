import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Sidebar } from "@/components/admin/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminHeader } from "@/components/admin/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersObj = await headers();
  const session = await auth.api.getSession({
    headers: headersObj,
  });

  if (!session) {
    redirect("/login");
  }

  // Verify admin or teacher access
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden border-r bg-background/95 md:block w-64">
        <ScrollArea className="h-full">
          <Sidebar userRole={user.role} />
        </ScrollArea>
      </div>
      <div className="flex-1 flex flex-col">
        <AdminHeader email={user.email} />
        <main className="flex-1 overflow-y-auto bg-background/95 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

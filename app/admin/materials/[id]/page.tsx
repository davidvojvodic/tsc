// app/admin/materials/[id]/page.tsx
import prisma from "@/lib/prisma";
import { MaterialForm } from "@/components/forms/material-form";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { format } from "date-fns";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export default async function MaterialPage({
  params,
}: {
  params: { id: string };
}) {
  const headersObj = await headers();
  const session = await auth.api.getSession({
    headers: headersObj,
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = await checkAdminAccess(session.user.id);
  if (!isAdmin) {
    redirect("/");
  }

  // Fetch existing material if we're editing
  const material =
    params.id !== "new"
      ? await prisma.material.findUnique({
          where: { id: params.id },
        })
      : null;

  const formattedMaterial = material
    ? {
        id: material.id,
        title: material.title,
        description: material.description,
        type: material.type,
        filename: material.filename,
        size: material.size,
        downloads: material.downloads,
        published: material.published,
        category: material.category,
        url: material.url,
        fileKey: material.fileKey,
        createdAt: format(material.createdAt, "MMMM do, yyyy"),
      }
    : undefined;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <MaterialForm initialData={formattedMaterial} />
      </div>
    </div>
  );
}

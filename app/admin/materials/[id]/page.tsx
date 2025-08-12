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
  params: Promise<{ id: string }>;
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

  // Await params before using
  const { id } = await params;

  // Fetch existing material if we're editing
  const material =
    id !== "new"
      ? await prisma.material.findUnique({
          where: { id },
        })
      : null;

  const formattedMaterial = material
    ? {
        id: material.id,
        title: material.title,
        title_sl: material.title_sl, 
        title_hr: material.title_hr, 
        description: material.description,
        description_sl: material.description_sl,
        description_hr: material.description_hr,
        type: material.type,
        filename: material.filename,
        size: material.size,
        downloads: material.downloads,
        published: material.published,
        category: material.category,
        url: material.url,
        fileKey: material.fileKey,
        language: material.language || "en", // Include language field with default
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
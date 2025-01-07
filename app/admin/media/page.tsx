// app/admin/media/page.tsx
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { MediaClient } from "./components/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MediaType } from "@prisma/client";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export default async function MediaPage() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = await checkAdminAccess(session.user.id);
  if (!isAdmin) {
    redirect("/");
  }

  // Fetch both Media and Material entries
  const [mediaItems, materials] = await Promise.all([
    prisma.media.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.material.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  // Format media items
  const formattedMedia = [...mediaItems.map((item) => ({
    id: item.id,
    source: 'media' as const,
    filename: item.filename,
    url: item.url,
    mimeType: item.mimeType,
    size: item.size,
    type: item.type,
    alt: item.alt,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  })),
  // Format materials
  ...materials.map((item) => ({
    id: item.id,
    source: 'material' as const,
    filename: item.filename,
    url: item.url,
    mimeType: getMimeType(item.type),
    size: item.size,
    type: convertMaterialType(item.type),
    downloads: item.downloads,
    alt: null,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }))];

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <MediaClient data={formattedMedia} />
      </div>
    </div>
  );
}

// Helper function to convert MaterialType to MediaType
function convertMaterialType(type: string): MediaType {
  switch (type) {
    case 'PDF':
    case 'WORD':
    case 'EXCEL':
    case 'POWERPOINT':
      return 'DOCUMENT';
    default:
      return 'OTHER';
  }
}

// Helper function to get MIME type from MaterialType
function getMimeType(type: string): string {
  switch (type) {
    case 'PDF':
      return 'application/pdf';
    case 'WORD':
      return 'application/msword';
    case 'EXCEL':
      return 'application/vnd.ms-excel';
    case 'POWERPOINT':
      return 'application/vnd.ms-powerpoint';
    default:
      return 'application/octet-stream';
  }
}
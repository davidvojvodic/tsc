// app/admin/materials/page.tsx
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { MaterialsClient } from "./components/client";

export default async function MaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedMaterials = materials.map((material) => ({
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
    createdAt: format(material.createdAt, "MMMM do, yyyy"),
    url: material.url,
    fileKey: material.fileKey,
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <MaterialsClient data={formattedMaterials} />
      </div>
    </div>
  );
}
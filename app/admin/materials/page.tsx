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
    description: material.description,
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

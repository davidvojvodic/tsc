// app/admin/projects/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ProjectCellAction } from "./cell-action";
import Image from "next/image";

export type ProjectColumn = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  published: boolean;
  featured: boolean;
  heroImage: { url: string } | null;
  createdAt: string;
};

export const columns: ColumnDef<ProjectColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const heroImage = row.original.heroImage;
      return (
        <div className="flex items-center gap-x-4">
          <div className="h-12 w-12 relative">
            {heroImage ? (
              <Image
                src={heroImage.url}
                alt={row.original.name}
                fill
                className="object-cover rounded-md"
              />
            ) : (
              <div className="h-full w-full bg-secondary rounded-md" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-sm text-muted-foreground">
              {row.original.slug}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description;
      return (
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {description || "No description"}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const published = row.original.published;
      const featured = row.original.featured;

      return (
        <div className="flex gap-2">
          <Badge variant={published ? "default" : "secondary"}>
            {published ? "Published" : "Draft"}
          </Badge>
          {featured && (
            <Badge variant="outline" className="bg-yellow-50">
              Featured
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
  },
  {
    id: "actions",
    cell: ({ row }) => <ProjectCellAction data={row.original} />,
  },
];

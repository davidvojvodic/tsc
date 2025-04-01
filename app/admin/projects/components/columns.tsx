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
  // Project thumbnail and name
  {
    accessorKey: "name",
    header: "Project",
    size: 280,
    cell: ({ row }) => {
      const heroImage = row.original.heroImage;
      return (
        <div className="flex items-center gap-x-3">
          <div className="h-14 w-20 relative rounded-md overflow-hidden flex-shrink-0">
            {heroImage ? (
              <Image
                src={heroImage.url}
                alt={row.original.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="h-full w-full bg-secondary/30 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate">{row.original.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              /{row.original.slug}
            </span>
          </div>
        </div>
      );
    },
  },
  // Status indicators
  {
    accessorKey: "status",
    header: "Status",
    size: 150,
    cell: ({ row }) => {
      const published = row.original.published;
      const featured = row.original.featured;

      return (
        <div className="flex flex-col gap-1.5">
          <Badge variant={published ? "default" : "outline"} className="w-fit">
            {published ? "Published" : "Draft"}
          </Badge>
          {featured && (
            <Badge variant="secondary" className="w-fit">
              Featured
            </Badge>
          )}
        </div>
      );
    },
  },
  // Creation date with safe formatting
  {
    accessorKey: "createdAt",
    header: "Created",
    size: 140,
    cell: ({ row }) => {
      try {
        // Handle potentially invalid date formats safely
        const timestamp = row.original.createdAt;
        let formatted = timestamp;
        
        if (timestamp) {
          // Try to parse the date safely
          const date = new Date(timestamp);
          
          // Check if date is valid before formatting
          if (!isNaN(date.getTime())) {
            formatted = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
          }
        }
        
        return <span className="text-sm">{formatted || "Unknown date"}</span>;
      } catch (error) {
        console.error("Date formatting error:", error);
        return <span className="text-sm text-muted-foreground">Invalid date</span>;
      }
    },
  },
  // Actions column
  {
    id: "actions",
    size: 80,
    cell: ({ row }) => <ProjectCellAction data={row.original} />,
  },
];

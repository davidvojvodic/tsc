// app/admin/testimonials/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { TestimonialCellAction } from "./cell-action";
import Image from "next/image";

export type TestimonialColumn = {
  id: string;
  name: string;
  role: string;
  content: string;
  featured: boolean;
  published: boolean;
  photo: { url: string } | null;
  createdAt: string;
};

export const columns: ColumnDef<TestimonialColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const photo = row.original.photo;
      return (
        <div className="flex items-center gap-x-4">
          <div className="h-10 w-10 relative">
            {photo ? (
              <Image
                src={photo.url}
                alt={row.original.name}
                fill
                className="object-cover rounded-full"
              />
            ) : (
              <div className="h-full w-full bg-secondary rounded-full" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-sm text-muted-foreground">{row.original.role}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "content",
    header: "Testimonial",
    cell: ({ row }) => (
      <p className="text-sm text-muted-foreground line-clamp-2">
        {row.original.content}
      </p>
    ),
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
    id: "actions",
    cell: ({ row }) => <TestimonialCellAction data={row.original} />,
  },
];
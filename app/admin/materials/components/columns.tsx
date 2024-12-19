"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MaterialCellAction } from "./cell-action";
import { formatBytes } from "@/lib/utils";

export type MaterialColumn = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  filename: string;
  size: number;
  downloads: number;
  published: boolean;
  category: string | null;
  createdAt: string;
  url: string; // Add this
  fileKey: string; // Add this
};

export const columns: ColumnDef<MaterialColumn>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      return (
        <Badge variant="secondary" className="text-xs">
          {row.original.type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => formatBytes(row.original.size),
  },
  {
    accessorKey: "downloads",
    header: "Downloads",
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category || "Uncategorized",
  },
  {
    accessorKey: "published",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.published ? "default" : "secondary"}>
        {row.original.published ? "Published" : "Draft"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Uploaded",
  },
  {
    id: "actions",
    cell: ({ row }) => <MaterialCellAction data={row.original} />,
  },
];

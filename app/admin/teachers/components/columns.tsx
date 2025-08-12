"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Teacher } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeacherCellAction } from "./cell-action";

export const columns: ColumnDef<Teacher>[] = [
  {
    accessorKey: "displayOrder",
    header: "Order",
    cell: ({ row }) => {
      const order = row.getValue("displayOrder") as number;
      return <div className="font-medium text-center">{order}</div>;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <div className="flex items-center gap-x-4">
          <Avatar>
            <AvatarImage src={teacher.photo?.url} />
            <AvatarFallback>{teacher.name[0]}</AvatarFallback>
          </Avatar>
          <div>{teacher.name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return <div className="max-w-[200px] truncate">{title || "-"}</div>;
    },
  },
  {
    accessorKey: "school",
    header: "School",
    cell: ({ row }) => {
      const school = row.getValue("school") as string | null;
      if (!school) return <div>-</div>;
      return (
        <div className="font-medium">
          {school === "pts" ? (
            <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800">PTS</span>
          ) : (
            <span className="px-2 py-1 rounded-md bg-green-100 text-green-800">TSC</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "bio",
    header: "Bio",
    cell: ({ row }) => {
      const bio = row.getValue("bio") as string;
      return <div className="line-clamp-2 max-w-[300px]">{bio || "No bio provided"}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    // The date is already formatted, just display it
    cell: ({ row }) => row.getValue("createdAt"),
  },
  {
    id: "actions",
    cell: ({ row }) => <TeacherCellAction data={row.original} />,
  },
];

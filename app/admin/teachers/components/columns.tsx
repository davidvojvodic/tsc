"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Teacher } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeacherCellAction } from "./cell-action";

export const columns: ColumnDef<Teacher>[] = [
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
    accessorKey: "bio",
    header: "Bio",
    cell: ({ row }) => {
      const bio = row.getValue("bio") as string;
      return <div className="line-clamp-2">{bio || "No bio provided"}</div>;
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

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./cell-action";

export type UserColumn = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER" | "TEACHER";
  createdAt: string;
};

export const userColumns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.original.name || "Not provided",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;

      return <Badge className="uppercase">{role.toLowerCase()}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Join Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./cell-action";

export type ContactColumn = {
  id: string;
  name: string;
  email: string;
  message: string;
  fullMessage: string;
  status: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export const columns: ColumnDef<ContactColumn>[] = [
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "unread" ? "destructive" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.original.fullMessage}>
        {row.getValue("message")}
      </div>
    ),
  },
  {
    accessorKey: "userName",
    header: "User Account",
    cell: ({ row }) => {
      const userName = row.getValue("userName") as string | null;
      return userName ? (
        <span className="text-sm text-muted-foreground">
          {userName}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground italic">
          Anonymous
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
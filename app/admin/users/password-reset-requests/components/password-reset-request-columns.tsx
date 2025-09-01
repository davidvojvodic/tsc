"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { CellAction } from "./cell-action";

export type PasswordResetRequestColumn = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  status: string;
  reason: string | null;
  requestedAt: string;
  processedAt: string | null;
  adminNotes: string | null;
  expiresAt: string;
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    PENDING: { 
      icon: Clock, 
      color: "bg-amber-100 text-amber-800 border-amber-200", 
      label: "Pending" 
    },
    APPROVED: { 
      icon: CheckCircle, 
      color: "bg-green-100 text-green-800 border-green-200", 
      label: "Approved" 
    },
    REJECTED: { 
      icon: XCircle, 
      color: "bg-red-100 text-red-800 border-red-200", 
      label: "Rejected" 
    },
    COMPLETED: { 
      icon: CheckCircle, 
      color: "bg-blue-100 text-blue-800 border-blue-200", 
      label: "Completed" 
    },
    EXPIRED: { 
      icon: AlertTriangle, 
      color: "bg-gray-100 text-gray-800 border-gray-200", 
      label: "Expired" 
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export const passwordResetRequestColumns: ColumnDef<PasswordResetRequestColumn>[] = [
  {
    accessorKey: "userEmail",
    header: "User",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.userEmail}</div>
        {row.original.userName && (
          <div className="text-sm text-muted-foreground">{row.original.userName}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.original.reason;
      if (!reason) return <span className="text-muted-foreground">No reason provided</span>;
      
      const truncated = reason.length > 50 ? reason.substring(0, 50) + "..." : reason;
      
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">{truncated}</div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{reason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "requestedAt",
    header: "Requested",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.requestedAt}
      </div>
    ),
  },
  {
    accessorKey: "processedAt",
    header: "Processed",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.processedAt || <span className="text-muted-foreground">Not processed</span>}
      </div>
    ),
  },
  {
    accessorKey: "expiresAt",
    header: "Expires",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.expiresAt}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
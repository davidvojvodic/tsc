"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Clock, CheckCircle, XCircle, AlertTriangle, Key, Copy, Eye } from "lucide-react";

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

// Props interface for column callbacks
interface PasswordResetRequestColumnsProps {
  expandedRow: string | null;
  onToggleExpansion: (rowId: string) => void;
  onViewDetails: (rowId: string) => void;
  onCopyId: (id: string) => void;
}

export const createPasswordResetRequestColumns = ({
  expandedRow,
  onToggleExpansion,
  onViewDetails,
  onCopyId,
}: PasswordResetRequestColumnsProps): ColumnDef<PasswordResetRequestColumn>[] => [
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
    header: "Actions",
    cell: ({ row }) => {
      const isExpanded = expandedRow === row.original.id;
      const canReset = row.original.status === "PENDING" || row.original.status === "APPROVED";
      
      return (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyId(row.original.id)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy ID</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(row.original.id)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant={isExpanded ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleExpansion(row.original.id)}
            disabled={!canReset}
            className={isExpanded ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <Key className="mr-1 h-3 w-3" />
            {isExpanded ? "Cancel" : "Reset"}
          </Button>
        </div>
      );
    },
  },
];
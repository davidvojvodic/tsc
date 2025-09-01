"use client";

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PasswordResetRequestColumn } from "./password-reset-request-columns";

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PasswordResetRequestColumn;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    PENDING: { color: "bg-amber-100 text-amber-800 border-amber-200", label: "Pending" },
    APPROVED: { color: "bg-green-100 text-green-800 border-green-200", label: "Approved" },
    REJECTED: { color: "bg-red-100 text-red-800 border-red-200", label: "Rejected" },
    COMPLETED: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Completed" },
    EXPIRED: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Expired" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Password Reset Request Details</DialogTitle>
          <DialogDescription>
            Review the complete details of this password reset request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">User Information</h3>
              <div className="space-y-1">
                <p className="font-medium">{data.userEmail}</p>
                {data.userName && (
                  <p className="text-sm text-muted-foreground">{data.userName}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Status</h3>
              {getStatusBadge(data.status)}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Request Reason</h3>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                {data.reason || "No reason provided"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Timeline</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Requested</p>
                  <p className="text-sm text-muted-foreground">{data.requestedAt}</p>
                </div>
                
                {data.processedAt && (
                  <div>
                    <p className="text-sm font-medium">Processed</p>
                    <p className="text-sm text-muted-foreground">{data.processedAt}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium">Expires</p>
                  <p className="text-sm text-muted-foreground">{data.expiresAt}</p>
                </div>
              </div>
            </div>
            
            {data.adminNotes && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Admin Notes</h3>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{data.adminNotes}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            <p><strong>Request ID:</strong> {data.id}</p>
            <p><strong>User ID:</strong> {data.userId}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
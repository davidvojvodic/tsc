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

import { ContactColumn } from "./columns";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ContactColumn;
}

export const ContactModal: React.FC<ContactModalProps> = ({
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
          <DialogTitle>Contact Submission Details</DialogTitle>
          <DialogDescription>
            View the full contact form submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge variant={data.status === "unread" ? "destructive" : "secondary"}>
              {data.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Name:</span>
              <p className="text-sm text-muted-foreground mt-1">{data.name}</p>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-sm text-muted-foreground mt-1">{data.email}</p>
            </div>
          </div>

          {data.userName && (
            <div>
              <span className="font-medium">User Account:</span>
              <p className="text-sm text-muted-foreground mt-1">
                {data.userName} ({data.userEmail})
              </p>
            </div>
          )}

          <Separator />

          <div>
            <span className="font-medium">Message:</span>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{data.fullMessage}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Submitted:</span>
              <p>{data.createdAt}</p>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <p>{data.updatedAt}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
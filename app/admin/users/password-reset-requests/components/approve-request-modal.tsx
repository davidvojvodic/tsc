"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PasswordResetRequestColumn } from "./password-reset-request-columns";

interface ApproveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PasswordResetRequestColumn;
  onSuccess: () => void;
}

const approveFormSchema = z.object({
  adminNotes: z.string().optional(),
});

type ApproveFormData = z.infer<typeof approveFormSchema>;

export const ApproveRequestModal: React.FC<ApproveRequestModalProps> = ({
  isOpen,
  onClose,
  data,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ApproveFormData>({
    resolver: zodResolver(approveFormSchema),
    defaultValues: {
      adminNotes: "",
    },
  });

  const onSubmit = async (formData: ApproveFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/password-reset-requests/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "APPROVED",
          adminNotes: formData.adminNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to approve request");
      }

      toast.success("Password reset request approved successfully");
      form.reset();
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Password Reset Request</DialogTitle>
          <DialogDescription>
            Approve the password reset request for {data.userEmail}. You&apos;ll be able to set a new password after approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes for this approval..."
                      rows={3}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
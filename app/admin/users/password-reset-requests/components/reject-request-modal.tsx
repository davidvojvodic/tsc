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

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PasswordResetRequestColumn;
  onSuccess: () => void;
}

const rejectFormSchema = z.object({
  adminNotes: z.string().min(10, "Please provide a reason for rejection (at least 10 characters)"),
});

type RejectFormData = z.infer<typeof rejectFormSchema>;

export const RejectRequestModal: React.FC<RejectRequestModalProps> = ({
  isOpen,
  onClose,
  data,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RejectFormData>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: {
      adminNotes: "",
    },
  });

  const onSubmit = async (formData: RejectFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/password-reset-requests/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REJECTED",
          adminNotes: formData.adminNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reject request");
      }

      toast.success("Password reset request rejected successfully");
      form.reset();
      onClose();
      onSuccess();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject request");
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
          <DialogTitle>Reject Password Reset Request</DialogTitle>
          <DialogDescription>
            Reject the password reset request for {data.userEmail}. You can contact the user directly with your reason.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Rejection *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a clear reason for rejecting this request..."
                      rows={4}
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Please provide a clear and professional reason for rejection. 
                You can contact the user directly through your preferred communication method.
              </p>
            </div>

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
                variant="destructive"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
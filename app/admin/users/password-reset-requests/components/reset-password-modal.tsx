"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, RefreshCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordResetRequestColumn } from "./password-reset-request-columns";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PasswordResetRequestColumn;
  onSuccess: () => void;
}

const resetPasswordFormSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminNotes: z.string().optional(),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

const generateSecurePassword = (length: number = 12): string => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one character from each type
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  data,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [newPasswordForUser, setNewPasswordForUser] = useState("");

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      newPassword: "",
      adminNotes: "",
    },
  });

  const onSubmit = async (formData: ResetPasswordFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/admin/password-reset-requests/${data.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      // Show success message and display the new password to admin
      setNewPasswordForUser(formData.newPassword);
      setResetComplete(true);
      toast.success(
        "Password reset successfully. Please provide the new password to the user."
      );
      onSuccess();
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const newPassword = generateSecurePassword(12);
    form.setValue("newPassword", newPassword);
    toast.success("Secure password generated");
  };

  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      setResetComplete(false);
      setNewPasswordForUser("");
      setShowPassword(false);
      onClose();
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setResetComplete(false);
      setNewPasswordForUser("");
      setShowPassword(false);
    }
  }, [isOpen, form]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          handleClose();
        }
      }}
    >
      <DialogContent
        className="max-w-md"
        onEscapeKeyDown={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {resetComplete ? "Password Reset Complete" : "Reset User Password"}
          </DialogTitle>
          <DialogDescription>
            {resetComplete
              ? `Password has been reset for ${data.userEmail}. Please provide the new password to the user.`
              : `Set a new password for ${data.userEmail}. You can provide this password to the user through your preferred communication method.`}
          </DialogDescription>
        </DialogHeader>

        {resetComplete ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                New Password for {data.userEmail}:
              </h4>
              <div className="bg-white border rounded p-3 font-mono text-sm break-all">
                {newPasswordForUser}
              </div>
              <p className="text-xs text-green-600 mt-2">
                Please provide this password to the user and encourage them to
                change it after their first login.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password *</FormLabel>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePassword}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes for this password reset..."
                        rows={3}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Security Notice:</strong> Please provide the new
                  password to the user through your preferred secure
                  communication method. Encourage them to change it after their
                  first login.
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

"use client";

import { useState } from "react";
import { 
  Copy, 
  MoreHorizontal, 
  Eye, 
  Key,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PasswordResetRequestColumn } from "./password-reset-request-columns";
import { RequestDetailsModal } from "./request-details-modal";
import { ResetPasswordModal } from "./reset-password-modal";

interface CellActionProps {
  data: PasswordResetRequestColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleDetailsClose = () => {
    setDetailsOpen(false);
  };

  const handleResetPasswordClose = () => {
    setResetPasswordOpen(false);
  };

  const handleResetPasswordOpen = () => {
    // Close dropdown first, then open modal after a brief delay to avoid focus conflicts
    setDropdownOpen(false);
    setTimeout(() => {
      setResetPasswordOpen(true);
    }, 100);
  };

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Request ID copied to clipboard");
  };

  const handleSuccess = async () => {
    try {
      setIsRefreshing(true);
      await router.refresh();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };


  return (
    <>
      <RequestDetailsModal
        isOpen={detailsOpen}
        onClose={handleDetailsClose}
        data={data}
      />
      
      <ResetPasswordModal
        isOpen={resetPasswordOpen}
        onClose={handleResetPasswordClose}
        data={data}
        onSuccess={handleSuccess}
      />
      
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isRefreshing}>
            <span className="sr-only">Open menu</span>
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => onCopy(data.id)} disabled={isRefreshing}>
            <Copy className="mr-2 h-4 w-4" /> Copy ID
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setDetailsOpen(true)} disabled={isRefreshing}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleResetPasswordOpen}
            className="text-blue-600 focus:text-blue-600"
            disabled={isRefreshing}
          >
            <Key className="mr-2 h-4 w-4" /> Reset Password
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
"use client";

import { useState } from "react";
import { MoreHorizontal, Eye, Check, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "@/components/modals/alert-modal";
import { ContactModal } from "./contact-modal";

import { ContactColumn } from "./columns";

interface CellActionProps {
  data: ContactColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const onConfirm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contact/${data.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Contact submission deleted.");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleViewOpen = () => {
    // Close dropdown first, then open modal after a brief delay to avoid focus conflicts
    setDropdownOpen(false);
    setTimeout(() => {
      setViewOpen(true);
    }, 100);
  };

  const handleViewClose = () => {
    setViewOpen(false);
  };

  const handleDeleteOpen = () => {
    // Close dropdown first, then open modal after a brief delay to avoid focus conflicts
    setDropdownOpen(false);
    setTimeout(() => {
      setOpen(true);
    }, 100);
  };

  const handleDeleteClose = () => {
    setOpen(false);
  };

  const markAsRead = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contact/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "read" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Marked as read.");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={handleDeleteClose}
        onConfirm={onConfirm}
        loading={loading}
      />
      <ContactModal
        isOpen={viewOpen}
        onClose={handleViewClose}
        data={data}
      />
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewOpen}>
            <Eye className="mr-2 h-4 w-4" /> View
          </DropdownMenuItem>
          {data.status === "unread" && (
            <DropdownMenuItem onClick={markAsRead}>
              <Check className="mr-2 h-4 w-4" /> Mark as Read
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDeleteOpen}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
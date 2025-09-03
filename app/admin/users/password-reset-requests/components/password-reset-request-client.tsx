"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { PasswordResetRequestColumn, createPasswordResetRequestColumns } from "./password-reset-request-columns";
import { InlinePasswordResetForm } from "./inline-password-reset-form";
import { RequestDetailsModal } from "./request-details-modal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PasswordResetRequestClientProps {
  data: PasswordResetRequestColumn[];
}

export const PasswordResetRequestClient: React.FC<PasswordResetRequestClientProps> = ({ data }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const router = useRouter();

  const handleToggleExpansion = (rowId: string) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  const handleViewDetails = (rowId: string) => {
    setSelectedRequestId(rowId);
    setDetailsModalOpen(true);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Request ID copied to clipboard");
  };

  const handlePasswordResetSuccess = () => {
    // Refresh the data by reloading the page
    router.refresh();
    // Keep the form expanded to show the success state
  };

  const handlePasswordResetCancel = () => {
    setExpandedRow(null);
  };

  const handleDetailsModalClose = () => {
    setDetailsModalOpen(false);
    setSelectedRequestId(null);
  };

  const selectedRequest = selectedRequestId ? data.find(item => item.id === selectedRequestId) : null;

  const columns = createPasswordResetRequestColumns({
    expandedRow,
    onToggleExpansion: handleToggleExpansion,
    onViewDetails: handleViewDetails,
    onCopyId: handleCopyId,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Password Reset Requests (${data.length})`}
          description="Review and manage user password reset requests"
          icon={Shield}
        />
      </div>
      <Separator />
      <div className="space-y-4">
        <DataTable 
          columns={columns} 
          data={data} 
          searchKey="userEmail" 
          filterKey="status"
          filterOptions={[
            { label: "All", value: "all" },
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Rejected", value: "REJECTED" },
            { label: "Completed", value: "COMPLETED" },
            { label: "Expired", value: "EXPIRED" },
          ]}
        />
        
        {/* Request Details Modal */}
        {selectedRequest && (
          <RequestDetailsModal
            isOpen={detailsModalOpen}
            onClose={handleDetailsModalClose}
            data={selectedRequest}
          />
        )}
        
        {/* Inline Password Reset Form */}
        {expandedRow && (
          <div className="mt-4">
            {(() => {
              const expandedRequest = data.find(item => item.id === expandedRow);
              if (!expandedRequest) return null;
              
              return (
                <InlinePasswordResetForm
                  data={expandedRequest}
                  onSuccess={handlePasswordResetSuccess}
                  onCancel={handlePasswordResetCancel}
                />
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
};
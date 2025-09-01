"use client";

import { Shield } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { PasswordResetRequestColumn, passwordResetRequestColumns } from "./password-reset-request-columns";

interface PasswordResetRequestClientProps {
  data: PasswordResetRequestColumn[];
}

export const PasswordResetRequestClient: React.FC<PasswordResetRequestClientProps> = ({ data }) => {
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
      <DataTable 
        columns={passwordResetRequestColumns} 
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
    </>
  );
};
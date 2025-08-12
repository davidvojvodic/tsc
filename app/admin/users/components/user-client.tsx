"use client";

import { Users } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { UserColumn, userColumns } from "./user-columns";

interface UserClientProps {
  data: UserColumn[];
}

export const UserClient: React.FC<UserClientProps> = ({ data }) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Users (${data.length})`}
          description="Manage user roles and permissions"
          icon={Users}
        />
      </div>
      <Separator />
      <DataTable columns={userColumns} data={data} searchKey="email" />
    </>
  );
};

"use client";

import { Users, Shield } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/users/password-reset-requests">
              <Shield className="mr-2 h-4 w-4" />
              Password Reset Requests
            </Link>
          </Button>
        </div>
      </div>
      <Separator />
      <DataTable columns={userColumns} data={data} searchKey="email" />
    </>
  );
};

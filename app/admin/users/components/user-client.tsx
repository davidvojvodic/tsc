"use client";

import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

import { UserColumn, userColumns } from "./user-columns";

interface UserClientProps {
  data: UserColumn[];
}

export const UserClient: React.FC<UserClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Users (${data.length})`}
          description="Manage your application users and their permissions"
          icon={Users}
        />
        <Button onClick={() => router.push(`/admin/users/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      <Separator />
      <DataTable columns={userColumns} data={data} searchKey="email" />
    </>
  );
};

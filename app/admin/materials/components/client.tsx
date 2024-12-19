"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { columns, MaterialColumn } from "./columns";

interface MaterialsClientProps {
  data: MaterialColumn[];
}

export const MaterialsClient: React.FC<MaterialsClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Resources (${data.length})`}
          description="Manage your learning resources and documents"
        />
        <Button onClick={() => router.push(`/admin/materials/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Add Resource
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="title" columns={columns} data={data} />
    </>
  );
};

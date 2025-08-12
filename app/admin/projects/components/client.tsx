// app/admin/projects/components/client.tsx
"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

import { columns, type ProjectColumn } from "./columns";

interface ProjectClientProps {
  data: ProjectColumn[];
}

export const ProjectClient: React.FC<ProjectClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Projects (${data.length})`}
          description="Manage your projects and their content"
        />
        <Button onClick={() => router.push(`/admin/projects/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={data} />
    </>
  );
};

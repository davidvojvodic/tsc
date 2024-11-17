"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { columns } from "./columns";
import { Teacher } from "@/lib/types";

interface TeacherClientProps {
  data: Teacher[];
}

export const TeacherClient: React.FC<TeacherClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Teachers (${data.length})`}
          description="Manage your teaching staff"
        />
        <Button onClick={() => router.push(`/admin/teachers/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Add Teacher
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={data} />
    </>
  );
};

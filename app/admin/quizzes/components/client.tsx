"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

import { columns, QuizColumn } from "./columns";

interface QuizClientProps {
  data: QuizColumn[];
}

export const QuizClient: React.FC<QuizClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Quizzes (${data.length})`}
          description="Manage your quizzes and assessments"
        />
        <Button onClick={() => router.push(`/admin/quizzes/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Add Quiz
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="title" columns={columns} data={data} />
    </>
  );
};
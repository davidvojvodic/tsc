// app/admin/quizzes/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { QuizCellAction } from "./cell-action";

export type QuizColumn = {
  id: string;
  title: string;
  description: string | null;
  teacher: {
    id: string;
    name: string;
  };
  questionCount: number;
  submissionCount: number;
  averageScore: number | null;
  createdAt: string;
};

export const columns: ColumnDef<QuizColumn>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "teacher",
    header: "Teacher",
    cell: ({ row }) => row.original.teacher.name,
  },
  {
    accessorKey: "questionCount",
    header: "Questions",
    cell: ({ row }) => {
      const count = row.original.questionCount;
      return (
        <Badge variant="secondary">
          {count} {count === 1 ? "question" : "questions"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "submissions",
    header: "Submissions",
    cell: ({ row }) => {
      const submissions = row.original.submissionCount;
      const average = row.original.averageScore;
      
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline">
            {submissions} {submissions === 1 ? "submission" : "submissions"}
          </Badge>
          {average !== null && (
            <span className="text-sm text-muted-foreground">
              Avg. Score: {average.toFixed(1)}%
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
  },
  {
    id: "actions",
    cell: ({ row }) => <QuizCellAction data={row.original} />,
  },
];
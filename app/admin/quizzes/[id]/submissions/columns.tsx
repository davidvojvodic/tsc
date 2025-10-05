// app/admin/quizzes/[id]/submissions/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle } from "lucide-react";

export interface QuizAnswer {
  questionId: string;
  questionText?: string;
  questionOrder?: number;
  questionType?: string;
  selectedOptionId?: string | null; // For single choice questions
  selectedAnswers?: string[]; // For multiple choice or text input (IDs)
  selectedAnswersText?: string[]; // Human readable selected answers
  correctAnswers?: string[]; // All correct answers (IDs)
  correctAnswersText?: string[]; // Human readable correct answers
  isCorrect: boolean;
  score?: number;
  maxScore?: number;
}

export type SubmissionColumn = {
  id: string;
  userName: string;
  userEmail: string;
  score: number;
  submittedAt: string;
  answers: QuizAnswer[];
};

export const submissionColumns: ColumnDef<SubmissionColumn>[] = [
  {
    accessorKey: "userName",
    header: "Student",
    cell: ({ row }) => (
      <div>
        <div>{row.original.userName}</div>
        <div className="text-sm text-muted-foreground">
          {row.original.userEmail}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => {
      const score = row.original.score;
      
      return (
        <Badge className={
          score >= 90 ? "bg-green-500" :
          score >= 70 ? "bg-blue-500" :
          score >= 50 ? "bg-yellow-500" :
          "bg-red-500"
        }>
          {score.toFixed(1)}%
        </Badge>
      );
    },
  },
  {
    accessorKey: "answers",
    header: "Answers",
    cell: ({ row }) => {
      const answers: QuizAnswer[] = Array.isArray(row.original.answers) ? row.original.answers : [];
      const correctCount = answers.filter(a => a.isCorrect).length;
      
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              View {correctCount}/{answers.length} correct
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quiz Answers</DialogTitle>
              <DialogDescription>
                Review the answers submitted by {row.original.userName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {answers
                .sort((a, b) => (a.questionOrder || 0) - (b.questionOrder || 0))
                .map((answer) => (
                <div
                  key={answer.questionId}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  {answer.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {answer.questionText || `Question ${answer.questionOrder || '?'}`}
                    </p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        {answer.isCorrect
                          ? "Correct answer"
                          : "Incorrect answer"}
                        {answer.score !== undefined && answer.maxScore !== undefined &&
                          ` (${answer.score}/${answer.maxScore} points)`
                        }
                      </p>
                      {answer.selectedAnswersText && answer.selectedAnswersText.length > 0 && (
                        <p>
                          <strong>Answer:</strong> {answer.selectedAnswersText.join(", ")}
                        </p>
                      )}
                      {answer.correctAnswersText && answer.correctAnswersText.length > 0 && (
                        <p>
                          <strong>Correct Answer:</strong> {answer.correctAnswersText.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Submitted",
  },
];
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
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Quiz Answers</DialogTitle>
              <DialogDescription>
                Review the answers submitted by {row.original.userName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto pr-2">
              {answers
                .sort((a, b) => (a.questionOrder || 0) - (b.questionOrder || 0))
                .map((answer, index) => (
                <div
                  key={answer.questionId}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  {answer.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-none">
                        Question {index + 1}
                      </p>
                      {answer.score !== undefined && answer.maxScore !== undefined && (
                        <Badge
                          variant={answer.isCorrect ? "default" : "secondary"}
                          className={
                            answer.score === answer.maxScore
                              ? "bg-green-600"
                              : answer.score > 0
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }
                        >
                          {answer.score}/{answer.maxScore} pts
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-foreground">
                      {answer.questionText || `Question ${answer.questionOrder || '?'}`}
                    </p>

                    {answer.selectedAnswersText && answer.selectedAnswersText.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Student Answer:</p>
                        <div className="space-y-1">
                          {answer.selectedAnswersText.map((text, i) => (
                            <div key={i} className="text-sm bg-muted/50 px-2 py-1 rounded">
                              {text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!answer.isCorrect && answer.correctAnswersText && answer.correctAnswersText.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-green-700">Correct Answer:</p>
                        <div className="space-y-1">
                          {answer.correctAnswersText.map((text, i) => (
                            <div key={i} className="text-sm bg-green-50 px-2 py-1 rounded border border-green-200">
                              {text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
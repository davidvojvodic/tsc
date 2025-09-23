"use client";

import { cn } from "@/lib/utils";
import { QuestionCompletionStatus } from "./question-list-item";

interface StatusIndicatorProps {
  status: QuestionCompletionStatus;
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <div
      className={cn(
        "w-3 h-3 rounded-full flex-shrink-0",
        {
          "bg-green-500": status === "complete",
          "bg-yellow-500": status === "partial",
          "bg-gray-400": status === "incomplete",
          "bg-red-500": status === "error",
        },
        className
      )}
      title={
        status === "complete"
          ? "Question is complete"
          : status === "partial"
          ? "Question is partially complete"
          : status === "error"
          ? "Question has errors"
          : "Question is incomplete"
      }
    />
  );
}
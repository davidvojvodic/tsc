"use client";

import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "./status-indicator";
import { Question } from "./quiz-editor-layout";
import { cn } from "@/lib/utils";

export type QuestionCompletionStatus = "incomplete" | "partial" | "complete" | "error";

interface QuestionListItemProps {
  question: Question;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  hasErrors: boolean;
  onClick: () => void;
}

export const QuestionListItem = memo(function QuestionListItem({
  question,
  index,
  isActive,
  isDragging,
  hasErrors,
  onClick
}: QuestionListItemProps) {
  const previewText = useMemo(() => {
    const text = question.text || "Untitled Question";
    return text.length > 50 ? `${text.substring(0, 50)}...` : text;
  }, [question.text]);

  const completionStatus = useMemo((): QuestionCompletionStatus => {
    if (hasErrors) return "error";
    if (!question.text) return "incomplete";

    if (question.questionType === "TEXT_INPUT") {
      // For TEXT_INPUT questions: check textInputData
      if (!question.textInputData ||
          !question.textInputData.acceptableAnswers ||
          question.textInputData.acceptableAnswers.length === 0) {
        return "incomplete";
      }
      if (question.textInputData.acceptableAnswers.every(answer => answer.trim())) {
        return "complete";
      }
      return "partial";
    } else {
      // For choice questions: check options
      if (question.options.length < 2) return "incomplete";
      if (question.options.every(o => o.text)) return "complete";
      return "partial";
    }
  }, [question.text, question.questionType, question.options, question.textInputData, hasErrors]);

  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 transition-all cursor-pointer select-none",
        "hover:border-blue-300 hover:shadow-sm",
        isActive && "border-blue-500 bg-blue-50 shadow-md",
        !isActive && "border-gray-200 bg-white",
        isDragging && "shadow-lg z-50 opacity-50 transform rotate-2",
        hasErrors && "border-red-300 bg-red-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs font-medium flex items-center justify-center">
            {index + 1}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {previewText}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {question.questionType.replace("_", " ")}
            </Badge>
            {question.questionType === "TEXT_INPUT" ? (
              question.textInputData?.acceptableAnswers && question.textInputData.acceptableAnswers.length > 0 && (
                <span className="text-xs text-gray-500">
                  {question.textInputData.acceptableAnswers.length} answer{question.textInputData.acceptableAnswers.length !== 1 ? 's' : ''}
                </span>
              )
            ) : (
              question.options.length > 0 && (
                <span className="text-xs text-gray-500">
                  {question.options.length} options
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <StatusIndicator status={completionStatus} />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.question.text === nextProps.question.text &&
    prevProps.question.questionType === nextProps.question.questionType &&
    prevProps.question.options.length === nextProps.question.options.length &&
    (prevProps.question.textInputData?.acceptableAnswers?.length || 0) ===
    (nextProps.question.textInputData?.acceptableAnswers?.length || 0) &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.hasErrors === nextProps.hasErrors &&
    prevProps.index === nextProps.index
  );
});
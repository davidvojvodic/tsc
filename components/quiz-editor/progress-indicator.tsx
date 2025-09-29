"use client";

import { useMemo } from "react";
import { useQuizEditor } from "./quiz-editor-provider";
import { isQuestionComplete } from "@/lib/quiz-validation";

export function ProgressIndicator() {
  const { questions, validationErrors } = useQuizEditor();

  const { completedQuestions, totalQuestions, progressPercentage } = useMemo(() => {
    const total = questions.length;
    const completed = questions.filter(question => {
      // Check for validation errors first
      const hasErrors = validationErrors[question.id]?.length > 0;
      if (hasErrors) return false;

      // Use the centralized validation function
      return isQuestionComplete(question);
    }).length;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completedQuestions: completed,
      totalQuestions: total,
      progressPercentage: percentage
    };
  }, [questions, validationErrors]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium text-gray-700">
        <span>Progress</span>
        <span>{completedQuestions} of {totalQuestions} complete</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 bg-gradient-to-r from-blue-600 to-green-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="text-center text-xs text-gray-600">
        {progressPercentage}% complete
      </div>
    </div>
  );
}
"use client";

import { useMemo } from "react";
import { useQuizEditor } from "./quiz-editor-provider";

export function ProgressIndicator() {
  const { questions, validationErrors } = useQuizEditor();

  const { completedQuestions, totalQuestions, progressPercentage } = useMemo(() => {
    const total = questions.length;
    const completed = questions.filter(question => {
      // A question is complete if it has text, at least 2 options, and no validation errors
      const hasErrors = validationErrors[question.id]?.length > 0;
      const hasText = question.text.trim().length > 0;
      const hasEnoughOptions = question.options.length >= 2;
      const allOptionsHaveText = question.options.every(opt => opt.text.trim().length > 0);

      return !hasErrors && hasText && hasEnoughOptions && allOptionsHaveText;
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
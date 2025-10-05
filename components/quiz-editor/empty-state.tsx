"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuizEditor } from "./quiz-editor-provider";

export function EmptyState() {
  const { addQuestion } = useQuizEditor();

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Questions Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Get started by adding your first question to this quiz.
        </p>
        <Button onClick={() => addQuestion()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add First Question
        </Button>
      </div>
    </div>
  );
}
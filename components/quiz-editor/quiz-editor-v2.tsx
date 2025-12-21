"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { QuizEditorLayout, QuizData, Teacher } from "./quiz-editor-layout";
import { GroupedValidationErrors } from "@/lib/validation-utils";

interface QuizEditorV2Props {
  teachers: Teacher[];
  initialData?: QuizData;
  onSave?: (data: QuizData) => Promise<void>;
  onCancel?: () => void;
  validationErrors?: GroupedValidationErrors | null;
}

export function QuizEditorV2({
  teachers,
  initialData,
  onSave,
  onCancel,
  validationErrors
}: QuizEditorV2Props) {
  const handleSave = useCallback(async (data: QuizData) => {
    if (onSave) {
      try {
        await onSave(data);
        toast.success("Quiz saved successfully!");
      } catch (error) {
        console.error("Failed to save quiz:", error);
        toast.error("Failed to save quiz. Please try again.");
        throw error;
      }
    } else {
      toast.success("Quiz would be saved (demo mode)");
    }
  }, [onSave]);

  return (
    <div className="w-full h-full">
      <QuizEditorLayout
        quiz={initialData}
        onSave={handleSave}
        onCancel={onCancel}
        teachers={teachers}
        validationErrors={validationErrors}
      />
    </div>
  );
}
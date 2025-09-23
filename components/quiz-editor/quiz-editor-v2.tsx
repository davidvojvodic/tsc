"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { QuizEditorLayout, QuizData, Teacher } from "./quiz-editor-layout";

interface QuizEditorV2Props {
  teachers: Teacher[];
  initialData?: QuizData;
  onSave?: (data: QuizData) => Promise<void>;
  onCancel?: () => void;
}

export function QuizEditorV2({
  teachers,
  initialData,
  onSave,
  onCancel
}: QuizEditorV2Props) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async (data: QuizData) => {
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(data);
        toast.success("Quiz saved successfully!");
      } catch (error) {
        console.error("Failed to save quiz:", error);
        toast.error("Failed to save quiz. Please try again.");
        throw error;
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log("Quiz data to save:", data);
      toast.success("Quiz would be saved (demo mode)");
    }
  }, [onSave]);

  // Auto-save functionality has been removed
  const handleAutoSave = useCallback(async () => {
    // Auto-save disabled
    return;
  }, []);

  return (
    <div className="w-full h-full">
      <QuizEditorLayout
        quiz={initialData}
        onSave={handleSave}
        onAutoSave={handleAutoSave}
        onCancel={onCancel}
        teachers={teachers}
      />
    </div>
  );
}
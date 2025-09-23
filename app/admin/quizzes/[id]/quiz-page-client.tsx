"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QuizEditorV2 } from "@/components/quiz-editor/quiz-editor-v2";
import { QuizData, Teacher } from "@/components/quiz-editor/quiz-editor-layout";

interface QuizPageClientProps {
  teachers: Teacher[];
  initialData?: QuizData;
  quizId: string;
}

export default function QuizPageClient({
  teachers,
  initialData,
  quizId,
}: QuizPageClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(
    async (data: QuizData) => {
      try {
        setIsSaving(true);

        // Transform data to match the API format
        const saveData = {
          title: data.title,
          description: data.description || "",
          teacherId: data.teacherId,
          questions: data.questions.map((question) => ({
            ...(quizId !== "new" && { id: question.id }), // Include ID only for existing quizzes
            text: question.text,
            options: question.options.map((option) => ({
              ...(quizId !== "new" && { id: option.id }), // Include ID only for existing options
              text: option.text,
              correct: option.isCorrect,
            })),
          })),
        };

        let response;
        if (quizId === "new") {
          // Create new quiz via POST to /api/quizzes
          response = await fetch("/api/quizzes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(saveData),
          });
        } else {
          // Update existing quiz via PATCH to /api/quizzes/[id]
          response = await fetch(`/api/quizzes/${quizId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(saveData),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${quizId === "new" ? "create" : "save"} quiz`);
        }

        const result = await response.json();
        toast.success(`Quiz ${quizId === "new" ? "created" : "saved"} successfully!`);

        if (quizId === "new") {
          // Redirect to the edit page for the newly created quiz
          router.push(`/admin/quizzes/${result.id}`);
        } else {
          // Refresh the page to get updated data
          router.refresh();
        }
      } catch (error) {
        console.error(`Failed to ${quizId === "new" ? "create" : "save"} quiz:`, error);
        toast.error(
          error instanceof Error ? error.message : `Failed to ${quizId === "new" ? "create" : "save"} quiz`
        );
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [quizId, router]
  );

  const handleCancel = useCallback(() => {
    router.push("/admin/quizzes");
  }, [router]);

  return (
    <div className="h-screen flex flex-col">
      <QuizEditorV2
        teachers={teachers}
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
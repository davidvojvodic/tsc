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

        // Helper function to check if ID is a real UUID vs generated ID
        const isRealUUID = (id: string | undefined): id is string => {
          return !!id && !!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        };

        // Transform data to match the API format
        if (process.env.NODE_ENV === 'development') {
          console.log("[QUIZ_SAVE] Original quiz data:", JSON.stringify(data, null, 2));
          console.log("[QUIZ_SAVE] Questions with special data:", data.questions.map(q => ({
            questionType: q.questionType,
            hasDropdownData: !!q.dropdownData,
            hasOrderingData: !!q.orderingData,
            dropdownData: q.dropdownData,
            orderingData: q.orderingData
          })));
        }

        const saveData = {
          title: data.title,
          title_sl: data.title_sl,
          title_hr: data.title_hr,
          description: data.description || "",
          description_sl: data.description_sl,
          description_hr: data.description_hr,
          teacherId: data.teacherId,
          questions: data.questions.map((question) => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[QUIZ_SAVE] Processing question ${question.questionType}:`, {
                hasDropdownData: !!question.dropdownData,
                hasOrderingData: !!question.orderingData,
                dropdownData: question.dropdownData,
                orderingData: question.orderingData
              });
            }
            return {
            // Only include ID if it's a real database UUID, not a generated ID
            ...(quizId !== "new" && isRealUUID(question.id) && { id: question.id }),
            text: question.text,
            text_sl: question.text_sl,
            text_hr: question.text_hr,
            questionType: question.questionType || "SINGLE_CHOICE", // Add questionType
            // Only include options for choice-based questions, not for TEXT_INPUT, DROPDOWN, or ORDERING
            ...(question.questionType !== "TEXT_INPUT" && question.questionType !== "DROPDOWN" && question.questionType !== "ORDERING" && {
              options: question.options.map((option) => ({
                // Only include ID if it's a real database UUID, not a generated ID
                ...(quizId !== "new" && isRealUUID(option.id) && { id: option.id }),
                text: option.text,
                text_sl: option.text_sl,
                text_hr: option.text_hr,
                isCorrect: option.isCorrect,
              }))
            }),
            ...(question.questionType === "MULTIPLE_CHOICE" && question.multipleChoiceData && {
              multipleChoiceData: question.multipleChoiceData
            }),
            ...(question.questionType === "TEXT_INPUT" && question.textInputData && {
              textInputData: question.textInputData
            }),
            ...(question.questionType === "DROPDOWN" && question.dropdownData && {
              dropdownData: question.dropdownData
            }),
            ...(question.questionType === "ORDERING" && question.orderingData && {
              orderingData: question.orderingData
            }),
            };
          }),
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
    <div className="h-[calc(100vh-4rem)] flex flex-col -mx-8 -my-8 -mb-8">
      <QuizEditorV2
        teachers={teachers}
        initialData={initialData}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QuizEditorV2 } from "@/components/quiz-editor/quiz-editor-v2";
import { QuizData, Teacher } from "@/components/quiz-editor/quiz-editor-layout";
import { quizSchema } from "@/lib/schemas/quiz";
import { parseValidationErrors, GroupedValidationErrors } from "@/lib/validation-utils";

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
  const [validationErrors, setValidationErrors] = useState<GroupedValidationErrors | null>(null);

  const handleSave = useCallback(
    async (data: QuizData) => {
      try {

        // Step 1: Validate the quiz data BEFORE sending to server
        const validationResult = quizSchema.safeParse(data);

        if (!validationResult.success) {
          // Parse and group validation errors
          const errors = parseValidationErrors(validationResult.error);
          setValidationErrors(errors);

          // Show toast notification
          toast.error(`Validation failed: ${errors.totalErrorCount} error${errors.totalErrorCount > 1 ? "s" : ""} found. Please fix them before saving.`);

          // Stop the save process
          return;
        }

        // Clear any previous validation errors if validation passed
        setValidationErrors(null);

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
            imageUrl: question.imageUrl,
            questionType: question.questionType || "SINGLE_CHOICE", // Add questionType
            // Only include options for choice-based questions, not for TEXT_INPUT, DROPDOWN, ORDERING, or MATCHING
            ...(question.questionType !== "TEXT_INPUT" && question.questionType !== "DROPDOWN" && question.questionType !== "ORDERING" && question.questionType !== "MATCHING" && {
              options: question.options.map((option) => ({
                // Only include ID if it's a real database UUID, not a generated ID
                ...(quizId !== "new" && isRealUUID(option.id) && { id: option.id }),
                text: option.text,
                text_sl: option.text_sl,
                text_hr: option.text_hr,
                isCorrect: option.isCorrect,
                // IMPORTANT: Include content object with imageUrl for image support
                content: option.content,
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
            ...(question.questionType === "MATCHING" && question.matchingData && {
              matchingData: question.matchingData
            }),
            };
          }),
        };

        console.log('[SAVE QUIZ] ===== SAVE PROCESS STARTING =====');
        console.log('[SAVE QUIZ] Quiz ID:', quizId);
        console.log('[SAVE QUIZ] Is New Quiz:', quizId === "new");
        console.log('[SAVE QUIZ] Prepared save data:', JSON.stringify(saveData, null, 2));

        let response;
        if (quizId === "new") {
          console.log('[SAVE QUIZ] Creating new quiz via POST /api/quizzes');
          // Create new quiz via POST to /api/quizzes
          response = await fetch("/api/quizzes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(saveData),
          });
        } else {
          console.log(`[SAVE QUIZ] Updating existing quiz via PATCH /api/quizzes/${quizId}`);
          // Update existing quiz via PATCH to /api/quizzes/[id]
          response = await fetch(`/api/quizzes/${quizId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(saveData),
          });
        }

        console.log('[SAVE QUIZ] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[SAVE QUIZ] Server returned error:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          console.error('[SAVE QUIZ] Parsed error data:', errorData);
          throw new Error(errorData.error || `Failed to ${quizId === "new" ? "create" : "save"} quiz`);
        }

        const result = await response.json();
        console.log('[SAVE QUIZ] ===== SUCCESS! =====');
        console.log('[SAVE QUIZ] Server response:', result);
        toast.success(`Quiz ${quizId === "new" ? "created" : "saved"} successfully!`);

        // Redirect to the quizzes list page after saving
        router.push("/admin/quizzes");
      } catch (error) {
        console.error('[SAVE QUIZ] ===== ERROR =====');
        console.error(`[SAVE QUIZ] Failed to ${quizId === "new" ? "create" : "save"} quiz:`, error);
        if (error instanceof Error) {
          console.error('[SAVE QUIZ] Error name:', error.name);
          console.error('[SAVE QUIZ] Error message:', error.message);
          console.error('[SAVE QUIZ] Error stack:', error.stack);
        }
        toast.error(
          error instanceof Error ? error.message : `Failed to ${quizId === "new" ? "create" : "save"} quiz`
        );
        throw error;
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
        validationErrors={validationErrors}
      />
    </div>
  );
}
"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuizEditor } from "./quiz-editor-provider";
import { QuestionListItem } from "./question-list-item";
import { ProgressIndicator } from "./progress-indicator";
import { GroupedValidationErrors, questionHasErrors } from "@/lib/validation-utils";

interface QuestionSidebarProps {
  currentIndex: number;
  onQuestionSelect: (index: number) => void;
  validationErrors?: GroupedValidationErrors | null;
}

export function QuestionSidebar({
  currentIndex,
  onQuestionSelect,
  validationErrors
}: QuestionSidebarProps) {
  const {
    questions,
    addQuestion
  } = useQuizEditor();

  const handleAddQuestion = () => {
    addQuestion();
    // Select the newly added question
    onQuestionSelect(questions.length);
  };

  return (
    <div className="flex flex-col h-full" data-sidebar>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
          <Button
            size="sm"
            onClick={handleAddQuestion}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <ProgressIndicator />
      </div>

      {/* Question List */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-3">
          {questions.map((question, index) => (
            <QuestionListItem
              key={question.id}
              question={question}
              index={index}
              isActive={index === currentIndex}
              isDragging={false} // Will be implemented with drag-and-drop
              hasErrors={questionHasErrors(validationErrors ?? null, index)}
              onClick={() => onQuestionSelect(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuizEditor } from "./quiz-editor-provider";
import { LanguageTabs } from "./language-tabs";
import { QuestionContent } from "./question-content";
import { OptionsEditor } from "./options-editor";
import { CollapsibleSection } from "./collapsible-section";
import { QuestionActions } from "./question-actions";
import { EmptyState } from "./empty-state";
import { AutoSaveIndicator } from "./autosave-indicator";
import { Teacher, Option } from "./quiz-editor-layout";

interface QuestionEditorProps {
  questionIndex: number;
  teachers: Teacher[];
  onQuestionChange: (index: number) => void;
}

export function QuestionEditor({
  questionIndex,
  teachers,
  onQuestionChange
}: QuestionEditorProps) {
  const {
    questions,
    currentLanguage,
    setCurrentLanguage,
    updateQuestion,
    deleteQuestion
  } = useQuizEditor();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const question = questions[questionIndex];

  if (!question) {
    return <EmptyState />;
  }

  const handlePrevious = () => {
    if (questionIndex > 0) {
      onQuestionChange(questionIndex - 1);
    }
  };

  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      onQuestionChange(questionIndex + 1);
    }
  };

  const handleQuestionUpdate = (field: string, value: string | Option[]) => {
    updateQuestion(questionIndex, { [field]: value });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Language Tabs */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Question {questionIndex + 1}
          </h3>
          <div className="flex items-center gap-3">
            <AutoSaveIndicator />
            <QuestionActions
              onDelete={() => deleteQuestion(questionIndex)}
              onDuplicate={() => {
                // TODO: Implement duplicate functionality
              }}
              onConvert={() => {
                // TODO: Implement convert functionality
              }}
            />
          </div>
        </div>

        <LanguageTabs
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hasContent={{
            en: !!question.text,
            sl: !!question.text_sl,
            hr: !!question.text_hr
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <QuestionContent
            question={question}
            language={currentLanguage}
            onChange={handleQuestionUpdate}
          />

          <OptionsEditor
            question={question}
            language={currentLanguage}
            onChange={handleQuestionUpdate}
          />

          <CollapsibleSection
            title="Advanced Settings"
            isExpanded={showAdvanced}
            onToggle={setShowAdvanced}
          >
            {question.questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Advanced multiple choice settings will be available here.
                </p>
                {/* TODO: Implement MultipleChoiceSettings component */}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-gray-200 bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={questionIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-gray-500">
            {questionIndex + 1} of {questions.length}
          </span>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={questionIndex === questions.length - 1}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
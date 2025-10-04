"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuizEditor } from "./quiz-editor-provider";
import { LanguageTabs } from "./language-tabs";
import { QuestionContent } from "./question-content";
import { OptionsEditor } from "./options-editor";
import { TextInputConfigurationEditor } from "./text-input-configuration-editor";
import { DropdownConfigurationEditor } from "./dropdown-configuration-editor";
import { OrderingConfigurationEditor } from "./ordering-configuration-editor";
import { MatchingConfigurationEditor } from "./matching-configuration-editor";
import { QuestionActions } from "./question-actions";
import { EmptyState } from "./empty-state";
import { AutoSaveIndicator } from "./autosave-indicator";
import { ScoringMethodSelector } from "./scoring-method-selector";
import { Teacher, Option, TextInputConfiguration, DropdownConfiguration, OrderingConfiguration, MatchingConfiguration } from "./quiz-editor-layout";
import { validateQuestion } from "@/lib/quiz-validation";

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

  const handleQuestionUpdate = (field: string, value: string | Option[] | TextInputConfiguration | DropdownConfiguration | OrderingConfiguration | MatchingConfiguration) => {
    updateQuestion(questionIndex, { [field]: value });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Language Tabs */}
      <div className="border-b border-gray-200 bg-white px-4 md:px-6 py-4 flex-shrink-0">
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
            en: (() => {
              const validation = validateQuestion({ ...question, text: question.text });
              // For matching questions, check if errors array is empty and completion percentage is high
              if (question.questionType === "MATCHING") {
                return validation.errors.length === 0 && validation.completionPercentage >= 90;
              }
              return validation.status === "complete";
            })(),
            sl: (() => {
              const validation = validateQuestion({ ...question, text: question.text_sl || question.text });
              if (question.questionType === "MATCHING") {
                return validation.errors.length === 0 && validation.completionPercentage >= 90 && !!question.text_sl;
              }
              return validation.status === "complete" && !!question.text_sl;
            })(),
            hr: (() => {
              const validation = validateQuestion({ ...question, text: question.text_hr || question.text });
              if (question.questionType === "MATCHING") {
                return validation.errors.length === 0 && validation.completionPercentage >= 90 && !!question.text_hr;
              }
              return validation.status === "complete" && !!question.text_hr;
            })()
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <QuestionContent
            question={question}
            language={currentLanguage}
            onChange={handleQuestionUpdate}
          />

          {/* Question Type Specific Editors */}
          {question.questionType === "TEXT_INPUT" ? (
            <TextInputConfigurationEditor
              question={question}
              language={currentLanguage}
              onChange={handleQuestionUpdate}
            />
          ) : question.questionType === "DROPDOWN" ? (
            <DropdownConfigurationEditor
              question={question}
              language={currentLanguage}
              onChange={handleQuestionUpdate}
            />
          ) : question.questionType === "ORDERING" ? (
            <OrderingConfigurationEditor
              question={question}
              language={currentLanguage}
              onChange={handleQuestionUpdate}
            />
          ) : question.questionType === "MATCHING" ? (
            <MatchingConfigurationEditor
              question={question}
              language={currentLanguage}
              onChange={handleQuestionUpdate}
            />
          ) : (
            <OptionsEditor
              question={question}
              language={currentLanguage}
              onChange={handleQuestionUpdate}
            />
          )}

          {question.questionType === "MULTIPLE_CHOICE" && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <ScoringMethodSelector
                value={question.multipleChoiceData?.scoringMethod || "ALL_OR_NOTHING"}
                onChange={(method) => {
                  const multipleChoiceData = {
                    ...question.multipleChoiceData,
                    scoringMethod: method,
                    minSelections: 1,
                    maxSelections: question.options.length,
                    partialCreditRules: {
                      correctSelectionPoints: 1,
                      incorrectSelectionPenalty: 0,
                      minScore: 0
                    }
                  };
                  updateQuestion(questionIndex, { multipleChoiceData });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-gray-200 bg-white px-4 md:px-6 py-4 flex-shrink-0">
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
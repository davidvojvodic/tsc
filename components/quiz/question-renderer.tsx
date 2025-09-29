"use client";

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MultipleChoiceQuestion } from "./question-types/multiple-choice-question";
import { TextInputQuestion } from "./question-types/text-input-question";
import { DropdownQuestion } from "./question-types/dropdown-question";
import { getLocalizedContent } from "@/lib/language-utils";
import { SupportedLanguage } from "@/store/language-context";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  text: string;
  text_sl?: string | null;
  text_hr?: string | null;
  isCorrect: boolean;
}

interface MultipleChoiceData {
  scoringMethod: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
  minSelections: number;
  maxSelections?: number;
  partialCreditRules?: {
    correctSelectionPoints: number;
    incorrectSelectionPenalty: number;
    minScore: number;
  };
}

interface TextInputData {
  acceptableAnswers: string[];
  caseSensitive: boolean;
  placeholder?: string;
  placeholder_sl?: string;
  placeholder_hr?: string;
}

interface DropdownOption {
  id: string;
  text: string;
  text_sl?: string;
  text_hr?: string;
  isCorrect: boolean;
}

interface DropdownField {
  id: string;
  label: string;
  label_sl?: string;
  label_hr?: string;
  options: DropdownOption[];
}

interface DropdownConfiguration {
  template: string;
  template_sl?: string;
  template_hr?: string;
  dropdowns: DropdownField[];
  scoring?: {
    pointsPerDropdown: number;
    requireAllCorrect: boolean;
    penalizeIncorrect: boolean;
  };
}

interface Question {
  id: string;
  text: string;
  text_sl?: string | null;
  text_hr?: string | null;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN";
  options?: Option[];
  multipleChoiceData?: MultipleChoiceData;
  textInputData?: TextInputData;
  dropdownData?: DropdownConfiguration;
}

interface QuestionRendererProps {
  question: Question;
  selectedAnswer: string | string[] | Record<string, string>;
  onAnswerChange: (questionId: string, answer: string | string[] | Record<string, string>) => void;
  disabled?: boolean;
  showValidation?: boolean;
  language?: SupportedLanguage;
  className?: string;
}

export function QuestionRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  disabled = false,
  showValidation = true,
  language = "en",
  className,
}: QuestionRendererProps) {
  const handleSingleChoiceChange = (value: string) => {
    onAnswerChange(question.id, value);
  };

  const handleMultipleChoiceChange = (questionId: string, selectedOptions: string[]) => {
    onAnswerChange(questionId, selectedOptions);
  };

  const handleTextInputChange = (questionId: string, answer: string) => {
    onAnswerChange(questionId, answer);
  };

  const handleDropdownChange = (questionId: string, answers: Record<string, string>) => {
    onAnswerChange(questionId, answers);
  };

  if (question.questionType === "MULTIPLE_CHOICE") {
    // Ensure we have the required multiple choice data
    if (!question.multipleChoiceData) {
      console.warn(`Multiple choice question ${question.id} is missing multipleChoiceData`);
      return null;
    }

    return (
      <MultipleChoiceQuestion
        questionId={question.id}
        text={question.text}
        text_sl={question.text_sl}
        text_hr={question.text_hr}
        options={question.options || []}
        multipleChoiceData={question.multipleChoiceData}
        selectedOptions={Array.isArray(selectedAnswer) ? selectedAnswer : []}
        onSelectionChange={handleMultipleChoiceChange}
        disabled={disabled}
        showValidation={showValidation}
        language={language}
        className={className}
      />
    );
  }

  if (question.questionType === "TEXT_INPUT") {
    // Ensure we have the required text input data
    if (!question.textInputData) {
      console.warn(`Text input question ${question.id} is missing textInputData`);
      return null;
    }

    return (
      <TextInputQuestion
        questionId={question.id}
        text={question.text}
        text_sl={question.text_sl}
        text_hr={question.text_hr}
        textInputData={question.textInputData}
        answer={typeof selectedAnswer === "string" ? selectedAnswer : ""}
        onAnswerChange={handleTextInputChange}
        disabled={disabled}
        showValidation={showValidation}
        language={language}
        className={className}
      />
    );
  }

  if (question.questionType === "DROPDOWN") {
    // Ensure we have the required dropdown data
    if (!question.dropdownData) {
      console.warn(`Dropdown question ${question.id} is missing dropdownData`);
      return null;
    }

    return (
      <DropdownQuestion
        questionId={question.id}
        text={question.text}
        text_sl={question.text_sl}
        text_hr={question.text_hr}
        dropdownData={question.dropdownData}
        selectedAnswers={typeof selectedAnswer === "object" && !Array.isArray(selectedAnswer) ? selectedAnswer : {}}
        onAnswerChange={handleDropdownChange}
        disabled={disabled}
        language={language}
        className={className}
      />
    );
  }

  // Single choice question (default)
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-xl font-medium">
        {getLocalizedContent(question, "text", language)}
      </h3>

      <RadioGroup
        value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
        onValueChange={handleSingleChoiceChange}
        disabled={disabled}
        className="space-y-3"
      >
        {question.options?.map((option) => (
          <div
            key={option.id}
            className={cn(
              "flex items-center space-x-2 rounded-lg border p-4 transition-colors",
              !disabled && "cursor-pointer hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <RadioGroupItem
              value={option.id}
              id={option.id}
              disabled={disabled}
            />
            <Label
              htmlFor={option.id}
              className={cn(
                "flex-1 cursor-pointer",
                disabled && "cursor-not-allowed"
              )}
            >
              {getLocalizedContent(option, "text", language)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
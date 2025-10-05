"use client";

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MultipleChoiceQuestion } from "./question-types/multiple-choice-question";
import { TextInputQuestion } from "./question-types/text-input-question";
import { DropdownQuestion } from "./question-types/dropdown-question";
import { OrderingQuestion } from "./question-types/ordering-question";
import { MatchingQuestion } from "./question-types/matching-question";
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

// Ordering content types - matching backend schema
type OrderingTextContent = {
  type: "text";
  text: string;
  text_sl?: string;
  text_hr?: string;
};

type OrderingImageContent = {
  type: "image";
  imageUrl: string;
  altText: string;
  altText_sl?: string;
  altText_hr?: string;
};

type OrderingItemContent = OrderingTextContent;

interface OrderingItem {
  id: string;
  correctPosition: number;
  content: OrderingItemContent;
}

interface OrderingConfiguration {
  instructions?: string;
  instructions_sl?: string;
  instructions_hr?: string;
  items: OrderingItem[];
  scoring?: {
    exactOrder?: boolean;
    partialCredit?: boolean;
    penaltyPerMisplacement?: number;
    adjacencyBonus?: boolean;
  };
  validation?: {
    requireAllItems?: boolean;
    allowPartialSubmission?: boolean;
  };
}

// Matching types (reuse content types from ordering)
type MatchingItemContent = OrderingItemContent;

interface MatchingItem {
  id: string;
  position: number;
  content: MatchingItemContent;
}

interface MatchingConnection {
  leftId: string;
  rightId: string;
}

interface CorrectMatch {
  leftId: string;
  rightId: string;
  explanation?: string;
  explanation_sl?: string;
  explanation_hr?: string;
}

interface MatchingConfiguration {
  instructions?: string;
  instructions_sl?: string;
  instructions_hr?: string;
  matchingType: "one-to-one";
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  correctMatches: CorrectMatch[];
  distractors?: string[];
  scoring?: {
    pointsPerMatch: number;
    penalizeIncorrect: boolean;
    penaltyPerIncorrect: number;
    requireAllMatches: boolean;
    partialCredit: boolean;
  };
  display?: {
    connectionStyle: "line" | "arrow" | "dashed";
    connectionColor: string;
    correctColor: string;
    incorrectColor: string;
    showConnectionLabels: boolean;
    animateConnections: boolean;
  };
}

interface Question {
  id: string;
  text: string;
  text_sl?: string | null;
  text_hr?: string | null;
  imageUrl?: string | null;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING";
  options?: Option[];
  multipleChoiceData?: MultipleChoiceData;
  textInputData?: TextInputData;
  dropdownData?: DropdownConfiguration;
  orderingData?: OrderingConfiguration;
  matchingData?: MatchingConfiguration;
}

interface QuestionRendererProps {
  question: Question;
  selectedAnswer: string | string[] | Record<string, string> | MatchingConnection[];
  onAnswerChange: (questionId: string, answer: string | string[] | Record<string, string> | MatchingConnection[]) => void;
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

  const handleOrderingChange = (questionId: string, order: string[]) => {
    onAnswerChange(questionId, order);
  };

  const handleMatchingChange = (questionId: string, connections: MatchingConnection[]) => {
    onAnswerChange(questionId, connections);
  };

  if (question.questionType === "MULTIPLE_CHOICE") {
    // Ensure we have the required multiple choice data
    if (!question.multipleChoiceData) {
      console.warn(`Multiple choice question ${question.id} is missing multipleChoiceData`);
      return null;
    }

    // Type guard for string array
    const isStringArray = (answer: typeof selectedAnswer): answer is string[] => {
      return Array.isArray(answer) && (answer.length === 0 || typeof answer[0] === 'string');
    };

    return (
      <MultipleChoiceQuestion
        questionId={question.id}
        text={question.text}
        text_sl={question.text_sl}
        text_hr={question.text_hr}
        options={question.options || []}
        multipleChoiceData={question.multipleChoiceData}
        selectedOptions={isStringArray(selectedAnswer) ? selectedAnswer : []}
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
        imageUrl={question.imageUrl}
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

  if (question.questionType === "ORDERING") {
    // Ensure we have the required ordering data
    if (!question.orderingData) {
      console.warn(`Ordering question ${question.id} is missing orderingData`);
      return null;
    }

    // Type guard for string array
    const isStringArray = (answer: typeof selectedAnswer): answer is string[] => {
      return Array.isArray(answer) && (answer.length === 0 || typeof answer[0] === 'string');
    };

    return (
      <OrderingQuestion
        questionId={question.id}
        questionData={question.orderingData}
        selectedAnswer={isStringArray(selectedAnswer) ? selectedAnswer : []}
        onAnswerChange={handleOrderingChange}
        disabled={disabled}
        language={language}
        className={className}
      />
    );
  }

  if (question.questionType === "MATCHING") {
    // Ensure we have the required matching data
    if (!question.matchingData) {
      console.warn(`Matching question ${question.id} is missing matchingData`);
      return null;
    }

    // Type guard to check if selectedAnswer is MatchingConnection[]
    const isMatchingAnswer = (answer: typeof selectedAnswer): answer is MatchingConnection[] => {
      return Array.isArray(answer) &&
             (answer.length === 0 || (typeof answer[0] === 'object' && 'leftId' in answer[0] && 'rightId' in answer[0]));
    };

    return (
      <MatchingQuestion
        questionId={question.id}
        questionData={question.matchingData}
        language={language}
        selectedAnswer={isMatchingAnswer(selectedAnswer) ? selectedAnswer : []}
        onAnswerChange={handleMatchingChange}
        disabled={disabled}
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
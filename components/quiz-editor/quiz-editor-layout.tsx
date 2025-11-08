"use client";

import { QuizEditorProvider } from "./quiz-editor-provider";
import { QuizEditorErrorBoundary } from "./quiz-editor-error-boundary";
import { QuizEditorWizard } from "./quiz-editor-wizard";
import { GroupedValidationErrors } from "@/lib/validation-utils";

export interface Teacher {
  id: string;
  name: string;
}

export interface QuizData {
  id?: string;
  title: string | null;
  title_sl: string | null;
  title_hr: string | null;
  description: string | null;
  description_sl: string | null;
  description_hr: string | null;
  teacherId: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string | null;
  text_sl: string | null;
  text_hr: string | null;
  imageUrl?: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING";
  options: Option[];
  multipleChoiceData?: MultipleChoiceConfiguration;
  textInputData?: TextInputConfiguration;
  dropdownData?: DropdownConfiguration;
  orderingData?: OrderingConfiguration;
  matchingData?: MatchingConfiguration;
  order?: number;
}

// Option content types - supports text and mixed (text + image)
export type OptionTextContent = {
  type: "text";
  text?: string;
  text_sl?: string;
  text_hr?: string;
};

export type OptionMixedContent = {
  type: "mixed";
  text?: string;
  text_sl?: string;
  text_hr?: string;
  imageUrl?: string;
};

export type OptionContent = OptionTextContent | OptionMixedContent;

export interface Option {
  id?: string;
  // Legacy text fields (for backward compatibility with existing quizzes)
  text?: string | null;
  text_sl?: string | null;
  text_hr?: string | null;
  // New content system (optional - if present, takes precedence over legacy text fields)
  content?: OptionContent;
  isCorrect: boolean;
  order?: number;
}

export interface MultipleChoiceConfiguration {
  scoringMethod: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
  minSelections: number;
  maxSelections?: number;
  partialCreditRules?: {
    correctSelectionPoints: number;
    incorrectSelectionPenalty: number;
    minScore: number;
  };
}

export interface TextInputConfiguration {
  acceptableAnswers: string[];
  caseSensitive: boolean;
  placeholder?: string;
  placeholder_sl?: string;
  placeholder_hr?: string;
}

export interface DropdownConfiguration {
  template?: string;
  template_sl?: string;
  template_hr?: string;
  dropdowns: DropdownField[];
  scoring?: {
    pointsPerDropdown: number;
    requireAllCorrect: boolean;
    penalizeIncorrect: boolean;
  };
}

export interface DropdownField {
  id: string;
  label?: string;
  label_sl?: string;
  label_hr?: string;
  options: DropdownOption[];
}

export interface DropdownOption {
  id: string;
  text?: string;
  text_sl?: string;
  text_hr?: string;
  isCorrect: boolean;
}

// Ordering content types - supports text and mixed (text + image)
export type OrderingTextContent = {
  type: "text";
  text?: string;
  text_sl?: string;
  text_hr?: string;
};

export type OrderingMixedContent = {
  type: "mixed";
  text?: string;
  text_sl?: string;
  text_hr?: string;
  imageUrl?: string;
};

export type OrderingItemContent = OrderingTextContent | OrderingMixedContent;

export interface OrderingItem {
  id: string;
  correctPosition: number; // Changed from 'position' to match backend schema
  content: OrderingItemContent; // Nested content structure
}

export interface OrderingConfiguration {
  instructions?: string;
  instructions_sl?: string;
  instructions_hr?: string;
  items: OrderingItem[];
  allowPartialCredit?: boolean;
  exactOrderRequired?: boolean;
}

// Matching content types - supports text, image, and mixed
export type MatchingTextContent = {
  type: "text";
  text?: string;
  text_sl?: string;
  text_hr?: string;
};

export type MatchingImageContent = {
  type: "image";
  imageUrl: string;
  altText?: string;
  altText_sl?: string;
  altText_hr?: string;
};

export type MatchingMixedContent = {
  type: "mixed";
  text?: string;
  text_sl?: string;
  text_hr?: string;
  imageUrl?: string;
  suffix?: string;
  suffix_sl?: string;
  suffix_hr?: string;
};

export type MatchingItemContent = MatchingTextContent | MatchingImageContent | MatchingMixedContent;

export interface MatchingItem {
  id: string;
  position: number;
  content: MatchingItemContent;
}

export interface CorrectMatch {
  leftId: string;
  rightId: string;
  explanation?: string;
  explanation_sl?: string;
  explanation_hr?: string;
}

export interface MatchingConfiguration {
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

interface QuizEditorLayoutProps {
  quiz?: QuizData;
  onSave: (data: QuizData) => Promise<void>;
  onAutoSave: (data: Partial<QuizData>) => Promise<void>;
  onCancel?: () => void;
  teachers: Teacher[];
  validationErrors?: GroupedValidationErrors | null;
}

export function QuizEditorLayout({
  quiz,
  onSave,
  onAutoSave,
  onCancel,
  teachers,
  validationErrors
}: QuizEditorLayoutProps) {

  return (
    <QuizEditorErrorBoundary>
      <QuizEditorProvider
        initialData={quiz}
        onSave={onSave}
      >
        <QuizEditorWizard
          teachers={teachers}
          onSave={onSave}
          onCancel={onCancel}
          validationErrors={validationErrors}
        />

      </QuizEditorProvider>
    </QuizEditorErrorBoundary>
  );
}
"use client";

import { QuizEditorProvider } from "./quiz-editor-provider";
import { QuizEditorErrorBoundary } from "./quiz-editor-error-boundary";
import { QuizEditorWizard } from "./quiz-editor-wizard";

export interface Teacher {
  id: string;
  name: string;
}

export interface QuizData {
  id?: string;
  title: string;
  title_sl?: string;
  title_hr?: string;
  description?: string;
  description_sl?: string;
  description_hr?: string;
  teacherId: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  text_sl?: string;
  text_hr?: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  options: Option[];
  multipleChoiceData?: MultipleChoiceConfiguration;
  order?: number;
}

export interface Option {
  id?: string;
  text: string;
  text_sl?: string;
  text_hr?: string;
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

interface QuizEditorLayoutProps {
  quiz?: QuizData;
  onSave: (data: QuizData) => Promise<void>;
  onAutoSave: (data: Partial<QuizData>) => Promise<void>;
  onCancel?: () => void;
  teachers: Teacher[];
}

export function QuizEditorLayout({
  quiz,
  onSave,
  onAutoSave,
  onCancel,
  teachers
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
        />
      </QuizEditorProvider>
    </QuizEditorErrorBoundary>
  );
}
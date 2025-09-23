"use client";

import { useState, useCallback } from "react";
import { QuestionSidebar } from "./question-sidebar";
import { QuestionEditor } from "./question-editor";
import { QuizEditorProvider } from "./quiz-editor-provider";
import { QuizEditorErrorBoundary } from "./quiz-editor-error-boundary";
import { QuizEditorHeader } from "./quiz-editor-header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleQuestionSelect = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  return (
    <QuizEditorErrorBoundary>
      <QuizEditorProvider
        initialData={quiz}
        onSave={onSave}
        onAutoSave={onAutoSave}
      >
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
          {/* Header */}
          <QuizEditorHeader
            teachers={teachers}
            onCancel={onCancel}
          />

          {/* Main Editor Area */}
          <div className="flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Sidebar Panel */}
              <ResizablePanel
                defaultSize={25}
                minSize={20}
                maxSize={40}
                className="border-r border-gray-200 bg-white"
              >
                <QuestionSidebar
                  currentIndex={currentQuestionIndex}
                  onQuestionSelect={handleQuestionSelect}
                />
              </ResizablePanel>

              {/* Resize Handle */}
              <ResizableHandle withHandle />

              {/* Main Content Panel */}
              <ResizablePanel
                defaultSize={75}
                minSize={60}
                className="bg-white"
              >
                <QuestionEditor
                  questionIndex={currentQuestionIndex}
                  teachers={teachers}
                  onQuestionChange={handleQuestionSelect}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </QuizEditorProvider>
    </QuizEditorErrorBoundary>
  );
}
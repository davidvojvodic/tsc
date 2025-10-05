"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { QuestionSidebar } from "./question-sidebar";
import { QuestionEditor } from "./question-editor";
import { AutoSaveIndicator } from "./autosave-indicator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Teacher, QuizData } from "./quiz-editor-layout";
import { useQuizEditor } from "./quiz-editor-provider";

interface QuestionsStepProps {
  teachers: Teacher[];
  onBack: () => void;
  onSave: (data: QuizData) => Promise<void>;
  onCancel?: () => void;
}

export function QuestionsStep({ teachers, onBack, onSave, onCancel }: QuestionsStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { quiz } = useQuizEditor();

  const handleQuestionSelect = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(quiz);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Details
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Quiz Questions</h1>
              <p className="text-sm text-gray-600">
                Add and configure your quiz questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AutoSaveIndicator />
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Quiz"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="h-full md:hidden">
          {/* Mobile Layout - Show only current editor */}
          <QuestionEditor
            questionIndex={currentQuestionIndex}
            teachers={teachers}
            onQuestionChange={handleQuestionSelect}
          />
        </div>

        <div className="hidden md:block h-full">
          {/* Desktop Layout - Resizable panels */}
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Sidebar Panel */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <QuestionSidebar
                currentIndex={currentQuestionIndex}
                onQuestionSelect={handleQuestionSelect}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Content Panel */}
            <ResizablePanel defaultSize={75} minSize={60}>
              <QuestionEditor
                questionIndex={currentQuestionIndex}
                teachers={teachers}
                onQuestionChange={handleQuestionSelect}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { QuizDetailsStep } from "./quiz-details-step";
import { QuestionsStep } from "./questions-step";
import { useQuizEditor } from "./quiz-editor-provider";
import { Teacher, QuizData } from "./quiz-editor-layout";
import { GroupedValidationErrors } from "@/lib/validation-utils";

interface QuizEditorWizardProps {
  teachers: Teacher[];
  onSave: (data: QuizData) => Promise<void>;
  onCancel?: () => void;
  validationErrors?: GroupedValidationErrors | null;
}

export function QuizEditorWizard({ teachers, onSave, onCancel, validationErrors }: QuizEditorWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const { quiz } = useQuizEditor();

  const validateStep1 = (): boolean => {
    // Check if at least one language has a title
    const hasTitle = (quiz.title !== null && quiz.title.trim().length > 0) ||
                     (quiz.title_sl !== null && quiz.title_sl.trim().length > 0) ||
                     (quiz.title_hr !== null && quiz.title_hr.trim().length > 0);
    return hasTitle && quiz.teacherId !== '';
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-8">
            {/* Step 1 */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 1
                  ? 'bg-blue-600 text-white'
                  : currentStep > 1
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className={`text-sm font-medium ${
                currentStep === 1 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Quiz Details
              </span>
            </div>

            {/* Connector */}
            <div className={`h-px w-12 ${
              currentStep > 1 ? 'bg-green-600' : 'bg-gray-300'
            }`} />

            {/* Step 2 */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${
                currentStep === 2 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Questions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        {currentStep === 1 ? (
          <QuizDetailsStep
            teachers={teachers}
            onNext={handleNext}
            onCancel={onCancel}
          />
        ) : (
          <QuestionsStep
            teachers={teachers}
            onBack={handleBack}
            onSave={onSave}
            onCancel={onCancel}
            validationErrors={validationErrors}
          />
        )}
      </div>
    </div>
  );
}
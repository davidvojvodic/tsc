"use client";

import { useState } from "react";
import { QuizDetailsStep } from "./quiz-details-step";
import { QuestionsStep } from "./questions-step";
import { useQuizEditor } from "./quiz-editor-provider";
import { Teacher, QuizData } from "./quiz-editor-layout";

interface QuizEditorWizardProps {
  teachers: Teacher[];
  onSave: (data: QuizData) => Promise<void>;
  onCancel?: () => void;
}

export function QuizEditorWizard({ teachers, onSave, onCancel }: QuizEditorWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const { quiz, saveQuiz } = useQuizEditor();

  const validateStep1 = (): boolean => {
    return quiz.title.trim() !== '' && quiz.teacherId !== '';
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
          />
        )}
      </div>
    </div>
  );
}
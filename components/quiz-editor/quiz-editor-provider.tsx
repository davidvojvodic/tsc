"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef
} from "react";
import { toast } from "sonner";
import { QuizData, Question, Option } from "./quiz-editor-layout";
import { validateQuestion as validateQuestionUtil, ValidationError } from "@/lib/quiz-validation";

export type Language = "en" | "sl" | "hr";

export interface QuizEditorContextType {
  // Quiz data
  quiz: QuizData;
  questions: Question[];
  currentQuestionIndex: number;
  currentLanguage: Language;

  // UI state
  hasUnsavedChanges: boolean;
  validationErrors: Record<string, ValidationError[]>;

  // Actions
  setCurrentQuestionIndex: (index: number) => void;
  setCurrentLanguage: (language: Language) => void;
  updateQuiz: (data: Partial<QuizData>) => void;
  updateQuestion: (index: number, data: Partial<Question>) => void;
  addQuestion: (template?: Partial<Question>) => void;
  deleteQuestion: (index: number) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  duplicateQuestion: (index: number) => void;

  // Validation
  validateQuestion: (index: number) => ValidationError[];
  validateQuiz: () => boolean;

  // Save functionality (manual only)
  saveQuiz: () => Promise<void>;
}

const QuizEditorContext = createContext<QuizEditorContextType | undefined>(undefined);

export function useQuizEditor() {
  const context = useContext(QuizEditorContext);
  if (context === undefined) {
    throw new Error("useQuizEditor must be used within a QuizEditorProvider");
  }
  return context;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function createDefaultQuestion(): Question {
  return {
    id: generateId(),
    text: null,
    text_sl: null,
    text_hr: null,
    questionType: "SINGLE_CHOICE",
    options: [
      { id: generateId(), text: null, text_sl: null, text_hr: null, isCorrect: true },
      { id: generateId(), text: null, text_sl: null, text_hr: null, isCorrect: false },
    ],
  };
}

function getDefaultQuiz(): QuizData {
  return {
    title: null,
    title_sl: null,
    title_hr: null,
    description: null,
    description_sl: null,
    description_hr: null,
    teacherId: "",
    questions: [createDefaultQuestion()],
  };
}

// Auto-save functionality has been removed

// Use the centralized validation function
function validateQuestion(question: Question): ValidationError[] {
  const validationResult = validateQuestionUtil(question);
  return validationResult.errors;
}

interface QuizEditorProviderProps {
  children: React.ReactNode;
  initialData?: QuizData;
  onSave: (data: QuizData) => Promise<void>;
}

export function QuizEditorProvider({
  children,
  initialData,
  onSave
}: QuizEditorProviderProps) {
  const [quiz, setQuiz] = useState<QuizData>(initialData || getDefaultQuiz());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, ValidationError[]>>({});

  // Auto-save functionality has been removed

  const updateQuestion = useCallback((index: number, data: Partial<Question>) => {
    setQuiz(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], ...data };
      return { ...prev, questions: newQuestions };
    });
    setHasUnsavedChanges(true);
  }, []);

  const addQuestion = useCallback((template?: Partial<Question>) => {
    const newQuestion = template ?
      { ...createDefaultQuestion(), ...template } :
      createDefaultQuestion();

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setCurrentQuestionIndex(quiz.questions.length);
    setHasUnsavedChanges(true);
  }, [quiz.questions.length]);

  const reorderQuestions = useCallback((fromIndex: number, toIndex: number) => {
    setQuiz(prev => {
      const newQuestions = [...prev.questions];
      const [removed] = newQuestions.splice(fromIndex, 1);
      newQuestions.splice(toIndex, 0, removed);
      return { ...prev, questions: newQuestions };
    });

    // Adjust current question index if necessary
    if (currentQuestionIndex === fromIndex) {
      setCurrentQuestionIndex(toIndex);
    } else if (fromIndex < currentQuestionIndex && toIndex >= currentQuestionIndex) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (fromIndex > currentQuestionIndex && toIndex <= currentQuestionIndex) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }

    setHasUnsavedChanges(true);
  }, [currentQuestionIndex]);

  // Real-time validation
  useEffect(() => {
    const errors: Record<string, ValidationError[]> = {};
    quiz.questions.forEach((question, index) => {
      const questionErrors = validateQuestion(question);
      if (questionErrors.length > 0) {
        errors[question.id] = questionErrors;
      }
    });
    setValidationErrors(errors);
  }, [quiz.questions]);

  const contextValue: QuizEditorContextType = {
    quiz,
    questions: quiz.questions,
    currentQuestionIndex,
    currentLanguage,
    hasUnsavedChanges,
    validationErrors,
    setCurrentQuestionIndex,
    setCurrentLanguage,
    updateQuiz: (data) => {
      setQuiz(prev => ({ ...prev, ...data }));
      setHasUnsavedChanges(true);
    },
    updateQuestion,
    addQuestion,
    deleteQuestion: (index) => {
      setQuiz(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
      if (currentQuestionIndex >= quiz.questions.length - 1) {
        setCurrentQuestionIndex(Math.max(0, quiz.questions.length - 2));
      }
      setHasUnsavedChanges(true);
    },
    reorderQuestions,
    duplicateQuestion: (index) => {
      const questionToDuplicate = { ...quiz.questions[index] };
      questionToDuplicate.id = generateId();
      setQuiz(prev => {
        const newQuestions = [...prev.questions];
        newQuestions.splice(index + 1, 0, questionToDuplicate);
        return { ...prev, questions: newQuestions };
      });
      setCurrentQuestionIndex(index + 1);
      setHasUnsavedChanges(true);
    },
    validateQuestion: (index) => {
      const validationResult = validateQuestionUtil(quiz.questions[index]);
      return validationResult.errors;
    },
    validateQuiz: () => quiz.questions.every(q => {
      const validationResult = validateQuestionUtil(q);
      return validationResult.errors.length === 0;
    }),
    saveQuiz: async () => {
      await onSave(quiz);
      setHasUnsavedChanges(false);
    }
  };

  return (
    <QuizEditorContext.Provider value={contextValue}>
      {children}
    </QuizEditorContext.Provider>
  );
}
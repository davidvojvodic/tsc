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

export type Language = "en" | "sl" | "hr";

export interface ValidationError {
  field: string;
  message: string;
}

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
    text: "",
    text_sl: "",
    text_hr: "",
    questionType: "SINGLE_CHOICE",
    options: [
      { id: generateId(), text: "", text_sl: "", text_hr: "", isCorrect: true },
      { id: generateId(), text: "", text_sl: "", text_hr: "", isCorrect: false },
    ],
  };
}

function getDefaultQuiz(): QuizData {
  return {
    title: "",
    title_sl: "",
    title_hr: "",
    description: "",
    description_sl: "",
    description_hr: "",
    teacherId: "",
    questions: [createDefaultQuestion()],
  };
}

// Auto-save functionality has been removed

// Validation functions
function validateQuestion(question: Question): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!question.text.trim()) {
    errors.push({
      field: "text",
      message: "Question text is required"
    });
  }

  // Options validation
  if (question.options.length < 2) {
    errors.push({
      field: "options",
      message: "At least 2 options are required"
    });
  }

  // Check for empty options
  question.options.forEach((option, index) => {
    if (!option.text.trim()) {
      errors.push({
        field: `options.${index}.text`,
        message: `Option ${index + 1} text is required`
      });
    }
  });

  // Question type specific validation
  if (question.questionType === "SINGLE_CHOICE") {
    const correctOptions = question.options.filter(o => o.isCorrect);
    if (correctOptions.length !== 1) {
      errors.push({
        field: "options",
        message: "Exactly one option must be marked as correct for single choice questions"
      });
    }
  } else if (question.questionType === "MULTIPLE_CHOICE") {
    const correctOptions = question.options.filter(o => o.isCorrect);
    if (correctOptions.length === 0) {
      errors.push({
        field: "options",
        message: "At least one option must be marked as correct for multiple choice questions"
      });
    }

    // Multiple choice configuration validation
    if (question.multipleChoiceData) {
      const { minSelections, maxSelections } = question.multipleChoiceData;

      if (minSelections < 1) {
        errors.push({
          field: "multipleChoiceData.minSelections",
          message: "Minimum selections must be at least 1"
        });
      }

      if (maxSelections && maxSelections > question.options.length) {
        errors.push({
          field: "multipleChoiceData.maxSelections",
          message: "Maximum selections cannot exceed number of options"
        });
      }

      if (maxSelections && minSelections > maxSelections) {
        errors.push({
          field: "multipleChoiceData.minSelections",
          message: "Minimum selections cannot exceed maximum selections"
        });
      }
    }
  }

  return errors;
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
    validateQuestion: (index) => validateQuestion(quiz.questions[index]),
    validateQuiz: () => quiz.questions.every(q => validateQuestion(q).length === 0),
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
"use client";

import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import QuizComponent from "@/components/quiz";
import { SupportedLanguage } from "@/store/language-context";
import { getLocalizedContent } from "@/lib/language-utils";
import type { OrderingConfiguration, MatchingConfiguration } from "@/components/quiz-editor/quiz-editor-layout";

interface Question {
  id: string;
  text: string | null;
  text_sl?: string | null;
  text_hr?: string | null;
  imageUrl?: string | null;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING" | null;
  options?: {
    id: string;
    text: string | null;
    text_sl?: string | null;
    text_hr?: string | null;
    isCorrect: boolean;
  }[];
  multipleChoiceData?: {
    scoringMethod: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
    minSelections: number;
    maxSelections?: number;
    partialCreditRules?: {
      correctSelectionPoints: number;
      incorrectSelectionPenalty: number;
      minScore: number;
    };
  };
  textInputData?: {
    acceptableAnswers: string[];
    caseSensitive: boolean;
    placeholder?: string;
    placeholder_sl?: string;
    placeholder_hr?: string;
  };
  dropdownData?: {
    template: string;
    template_sl?: string;
    template_hr?: string;
    dropdowns: Array<{
      id: string;
      label: string;
      label_sl?: string;
      label_hr?: string;
      options: Array<{
        id: string;
        text: string | null;
        text_sl?: string;
        text_hr?: string;
        isCorrect: boolean;
      }>;
    }>;
    scoring?: {
      pointsPerDropdown: number;
      requireAllCorrect: boolean;
      penalizeIncorrect: boolean;
    };
  };
  orderingData?: OrderingConfiguration;
  matchingData?: MatchingConfiguration;
}

interface Quiz {
  id: string;
  title: string | null;
  title_sl?: string | null;
  title_hr?: string | null;
  description: string | null;
  description_sl?: string | null;
  description_hr?: string | null;
  questions: Question[];
}

interface QuizDetailPageProps {
  quiz: Quiz;
  language: SupportedLanguage;
}

export function QuizDetailPage({ quiz, language }: QuizDetailPageProps) {
  if (!quiz) {
    notFound();
  }

  // Get localized content
  const quizTitle = getLocalizedContent(quiz, "title", language);
  const quizDescription = getLocalizedContent(quiz, "description", language);

  // Localize questions and options
  const localizedQuestions = quiz.questions.map(question => {
    const questionText = getLocalizedContent(question, "text", language);

    const localizedOptions = question.options?.map(option => ({
      id: option.id,
      text: getLocalizedContent(option, "text", language) || option.text,
      isCorrect: option.isCorrect
    })) || [];

    return {
      id: question.id,
      text: questionText || question.text,
      imageUrl: question.imageUrl ?? undefined,
      questionType: (question.questionType || "SINGLE_CHOICE") as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING",
      options: localizedOptions,
      multipleChoiceData: question.multipleChoiceData ?? undefined,
      textInputData: question.textInputData ?? undefined,
      dropdownData: question.dropdownData ?? undefined,
      orderingData: question.orderingData ?? undefined,
      matchingData: question.matchingData ?? undefined
    };
  });

  const localizedQuiz = {
    id: quiz.id,
    title: quizTitle || quiz.title,
    title_sl: quiz.title_sl,
    title_hr: quiz.title_hr,
    description: quizDescription || quiz.description,
    description_sl: quiz.description_sl,
    description_hr: quiz.description_hr,
    questions: localizedQuestions
  };

  return (
    <Container>
      <div className="py-16 md:py-24">
        <QuizComponent quiz={localizedQuiz as unknown as Parameters<typeof QuizComponent>[0]['quiz']} language={language} />
      </div>
    </Container>
  );
}
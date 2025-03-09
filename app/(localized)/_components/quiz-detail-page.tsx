"use client";

import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import QuizComponent from "@/components/quiz";
import { SupportedLanguage } from "@/store/language-context";
import { getLocalizedContent } from "@/lib/language-utils";

interface Question {
  id: string;
  text: string;
  text_sl?: string | null;
  text_hr?: string | null;
  options: {
    id: string;
    text: string;
    text_sl?: string | null;
    text_hr?: string | null;
    isCorrect: boolean;
  }[];
}

interface Quiz {
  id: string;
  title: string;
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
    
    const localizedOptions = question.options.map(option => ({
      id: option.id,
      text: getLocalizedContent(option, "text", language) || option.text,
      isCorrect: option.isCorrect
    }));

    return {
      id: question.id,
      text: questionText || question.text,
      options: localizedOptions
    };
  });

  const localizedQuiz = {
    ...quiz,
    title: quizTitle || quiz.title,
    description: quizDescription || quiz.description,
    questions: localizedQuestions
  };

  return (
    <Container>
      <div className="py-16 md:py-24">
        <QuizComponent quiz={localizedQuiz} language={language} />
      </div>
    </Container>
  );
}
"use client";

import React, { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";


import { AlertCircle, CheckCircle2, Trophy, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


import Link from "next/link";

import { SupportedLanguage } from "@/store/language-context";

import { QuestionRenderer } from "@/components/quiz/question-renderer";

import { getLocalizedContent } from "@/lib/language-utils";

import type { OrderingConfiguration } from "@/components/quiz-editor/quiz-editor-layout";

interface Option {
  id: string;
  text: string | null;
  text_sl?: string | null;
  text_hr?: string | null;
  isCorrect: boolean;
}

interface MultipleChoiceData {
  scoringMethod: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
  minSelections: number;
  maxSelections?: number;
  partialCreditRules?: {
    correctSelectionPoints: number;
    incorrectSelectionPenalty: number;
    minScore: number;
  };
}

interface TextInputData {
  acceptableAnswers: string[];
  caseSensitive: boolean;
  placeholder?: string;
  placeholder_sl?: string;
  placeholder_hr?: string;
}

interface DropdownConfiguration {
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

interface DropdownField {
  id: string;
  label?: string;
  label_sl?: string;
  label_hr?: string;
  options: DropdownOption[];
}

interface DropdownOption {
  id: string;
  text?: string;
  text_sl?: string;
  text_hr?: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string | null;
  text_sl?: string | null;
  text_hr?: string | null;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING";
  options?: Option[];
  multipleChoiceData?: MultipleChoiceData;
  textInputData?: TextInputData;
  dropdownData?: DropdownConfiguration;
  orderingData?: OrderingConfiguration;
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

interface QuizComponentProps {
  quiz: Quiz;

  language?: SupportedLanguage;
}

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      quizComplete: "Quiz Complete!",

      hereIsHowYouDid: "Here's how you did on the quiz:",

      correctAnswers: "Correct Answers",

      points: "points",

      yourScore: "Your Score",

      perfectScore: "Perfect Score!",

      wellDone: "Well Done!",

      keepPracticing: "Keep Practicing!",

      question: "Question",

      of: "of",

      backToQuizzes: "Back to Quizzes",

      tryAgain: "Try Again",

      previous: "Previous",

      next: "Next",

      submitQuiz: "Submit Quiz",

      correct: "Correct",

      incorrect: "Incorrect",
    },

    sl: {
      quizComplete: "Kviz zaključen!",

      hereIsHowYouDid: "Tako ste se odrezali na kvizu:",

      correctAnswers: "Pravilni odgovori",

      points: "točk",

      yourScore: "Vaš rezultat",

      perfectScore: "Odličen rezultat!",

      wellDone: "Dobro opravljeno!",

      keepPracticing: "Vadite naprej!",

      question: "Vprašanje",

      of: "od",

      backToQuizzes: "Nazaj na kvize",

      tryAgain: "Poskusi znova",

      previous: "Prejšnje",

      next: "Naslednje",

      submitQuiz: "Oddaj kviz",

      correct: "Pravilno",

      incorrect: "Nepravilno",
    },

    hr: {
      quizComplete: "Kviz završen!",

      hereIsHowYouDid: "Evo kako ste riješili kviz:",

      correctAnswers: "Točni odgovori",

      points: "bodova",

      yourScore: "Vaš rezultat",

      perfectScore: "Savršen rezultat!",

      wellDone: "Odlično!",

      keepPracticing: "Nastavite vježbati!",

      question: "Pitanje",

      of: "od",

      backToQuizzes: "Natrag na kvizove",

      tryAgain: "Pokušaj ponovno",

      previous: "Prethodno",

      next: "Sljedeće",

      submitQuiz: "Predaj kviz",

      correct: "Točno",

      incorrect: "Netočno",
    },
  };

  return translations[language];
};

export default function QuizComponent({
  quiz,
  language = "en",
}: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | string[] | Record<string, string> | Array<{leftId: string; rightId: string}>>
  >({});

  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Detailed scoring for partial credit
  const [totalScore, setTotalScore] = useState(0);
  const [maxTotalScore, setMaxTotalScore] = useState(0);
  const [scorePercentage, setScorePercentage] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = getTranslations(language);

  const prefix = language === "en" ? "" : `/${language}`;

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const totalQuestions = quiz.questions.length;

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerChange = (
    questionId: string,
    answer: string | string[] | Record<string, string> | Array<{leftId: string; rightId: string}>
  ) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const isCurrentQuestionAnswered = () => {
    const answer = selectedOptions[currentQuestion.id];
    if (currentQuestion.questionType === "MULTIPLE_CHOICE") {
      const selectedIds = Array.isArray(answer) ? answer : [];
      const minSelections = currentQuestion.multipleChoiceData?.minSelections || 1;
      return selectedIds.length >= minSelections;
    }
    if (currentQuestion.questionType === "TEXT_INPUT") {
      return typeof answer === "string" && answer.trim().length > 0;
    }
    if (currentQuestion.questionType === "DROPDOWN") {
      const dropdownAnswers = answer as Record<string, string>;
      if (!dropdownAnswers || typeof dropdownAnswers !== "object") return false;
      const dropdowns = currentQuestion.dropdownData?.dropdowns || [];
      return dropdowns.every(dropdown => dropdownAnswers[dropdown.id] && dropdownAnswers[dropdown.id].trim().length > 0);
    }
    if (currentQuestion.questionType === "ORDERING") {
      const orderingAnswer = Array.isArray(answer) ? answer : [];
      const totalItems = currentQuestion.orderingData?.items.length || 0;
      return orderingAnswer.length === totalItems;
    }
    if (currentQuestion.questionType === "MATCHING") {
      const matchingAnswer = Array.isArray(answer) ? answer : [];
      // At least one connection required
      return matchingAnswer.length > 0;
    }
    return !!answer;
  };

  const areAllQuestionsAnswered = () => {
    return quiz.questions.every((question) => {
      const answer = selectedOptions[question.id];
      if (question.questionType === "MULTIPLE_CHOICE") {
        const selectedIds = Array.isArray(answer) ? answer : [];
        const minSelections = question.multipleChoiceData?.minSelections || 1;
        return selectedIds.length >= minSelections;
      }
      if (question.questionType === "TEXT_INPUT") {
        return typeof answer === "string" && answer.trim().length > 0;
      }
      if (question.questionType === "DROPDOWN") {
        const dropdownAnswers = answer as Record<string, string>;
        if (!dropdownAnswers || typeof dropdownAnswers !== "object") return false;
        const dropdowns = question.dropdownData?.dropdowns || [];
        return dropdowns.every(dropdown => dropdownAnswers[dropdown.id] && dropdownAnswers[dropdown.id].trim().length > 0);
      }
      if (question.questionType === "ORDERING") {
        const orderingAnswer = Array.isArray(answer) ? answer : [];
        const totalItems = question.orderingData?.items.length || 0;
        return orderingAnswer.length === totalItems;
      }
      if (question.questionType === "MATCHING") {
        const matchingAnswer = Array.isArray(answer) ? answer : [];
        // At least one connection required
        return matchingAnswer.length > 0;
      }
      return !!answer;
    });
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
    // Scroll to top of page when navigating between questions
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
    // Scroll to top of page when navigating between questions
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Submit quiz answers to the API
      const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: selectedOptions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      const result = await response.json();

      // Use the server-calculated score
      setCorrectAnswers(result.correctAnswers);

      // Store detailed scoring data if available
      if (result.scoring) {
        setTotalScore(result.scoring.totalScore);
        setMaxTotalScore(result.scoring.maxTotalScore);
        setScorePercentage(result.scoring.percentage);
      } else {
        // Fallback to legacy percentage calculation
        setScorePercentage(result.score || 0);
      }

      setQuizSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);

      // Fallback to local calculation if API fails (with no penalties)
      let score = 0;
      Object.keys(selectedOptions).forEach((questionId) => {
        const question = quiz.questions.find((q) => q.id === questionId);
        if (question) {
          const selectedAnswer = selectedOptions[questionId];

          if (question.questionType === "MULTIPLE_CHOICE") {
            const selectedIds = Array.isArray(selectedAnswer) ? selectedAnswer : [];
            const correctOptions = (question.options || []).filter(o => o.isCorrect);
            const selectedCorrectCount = selectedIds.filter(id =>
              correctOptions.some(o => o.id === id)
            ).length;

            // Check scoring method from multipleChoiceData
            const scoringMethod = question.multipleChoiceData?.scoringMethod || "ALL_OR_NOTHING";

            if (scoringMethod === "PARTIAL_CREDIT") {
              // Partial credit: give proportional score based on correct selections (no penalties)
              if (correctOptions.length > 0) {
                const partialScore = selectedCorrectCount / correctOptions.length;
                score += partialScore;
              }
            } else {
              // All or nothing: only score if all correct and no incorrect
              const selectedIncorrectCount = selectedIds.length - selectedCorrectCount;
              if (selectedCorrectCount === correctOptions.length && selectedIncorrectCount === 0) {
                score++;
              }
            }
          } else if (question.questionType === "TEXT_INPUT") {
            // TEXT_INPUT scoring - simple implementation for fallback
            // In production, this should use the server's scoring logic
            if (typeof selectedAnswer === "string" && selectedAnswer.trim()) {
              // Basic scoring - in reality this should check against acceptable answers
              // For now, just give credit for having an answer
              score += 0.5; // Partial credit since we can't validate properly client-side
            }
          } else {
            // Single choice scoring
            const selectedOption = (question.options || []).find(
              (o) => o.id === selectedAnswer
            );
            if (selectedOption?.isCorrect) {
              score++;
            }
          }
        }
      });

      setCorrectAnswers(score);
      setQuizSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSelectedOptions({});

    setCurrentQuestionIndex(0);

    setQuizSubmitted(false);

    setCorrectAnswers(0);
    setTotalScore(0);
    setMaxTotalScore(0);
    setScorePercentage(0);
  };

  const renderResultMessage = () => {
    // Use scorePercentage from API if available, otherwise calculate from correctAnswers
    const percentage = scorePercentage || (correctAnswers / totalQuestions) * 100;

    // Determine what to display - points or correct answer count
    const showPoints = maxTotalScore > 0;

    if (percentage === 100) {
      return (
        <Alert className="bg-green-50 border-green-200 mb-6">
          <Trophy className="h-5 w-5 text-green-600" />

          <AlertTitle className="text-green-800 font-bold">
            {t.perfectScore}
          </AlertTitle>

          <AlertDescription className="text-green-700 space-y-2">
            <div className="text-lg font-semibold">
              {percentage.toFixed(1)}%
            </div>
            {showPoints && (
              <div className="text-sm">
                {totalScore} / {maxTotalScore} {t.points}
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    } else if (percentage >= 70) {
      return (
        <Alert className="bg-blue-50 border-blue-200 mb-6">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />

          <AlertTitle className="text-blue-800 font-bold">
            {t.wellDone}
          </AlertTitle>

          <AlertDescription className="text-blue-700 space-y-2">
            <div className="text-lg font-semibold">
              {percentage.toFixed(1)}%
            </div>
            {showPoints && (
              <div className="text-sm">
                {totalScore} / {maxTotalScore} {t.points}
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert className="bg-amber-50 border-amber-200 mb-6">
          <AlertCircle className="h-5 w-5 text-amber-600" />

          <AlertTitle className="text-amber-800 font-bold">
            {t.keepPracticing}
          </AlertTitle>

          <AlertDescription className="text-amber-700 space-y-2">
            <div className="text-lg font-semibold">
              {percentage.toFixed(1)}%
            </div>
            {showPoints && (
              <div className="text-sm">
                {totalScore} / {maxTotalScore} {t.points}
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }
  };

  if (quizSubmitted) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t.quizComplete}</CardTitle>

          <CardDescription>{t.hereIsHowYouDid}</CardDescription>
        </CardHeader>

        <CardContent>
          {renderResultMessage()}

          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {language === "en" && "Your quiz has been submitted successfully!"}
              {language === "sl" && "Vaš kviz je bil uspešno oddan!"}
              {language === "hr" && "Vaš kviz je uspješno predan!"}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === "en" && "Your teacher will review your answers and provide feedback."}
              {language === "sl" && "Vaš učitelj bo pregledal vaše odgovore in vam dal povratne informacije."}
              {language === "hr" && "Vaš učitelj će pregledati vaše odgovore i dati vam povratne informacije."}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button asChild variant="outline">
            <Link href={`${prefix}/quizzes`}>{t.backToQuizzes}</Link>
          </Button>

          <Button onClick={handleTryAgain}>{t.tryAgain}</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-2xl">
            {getLocalizedContent(quiz, "title", language)}
          </CardTitle>

          <div className="text-sm text-muted-foreground">
            {t.question} {currentQuestionIndex + 1} {t.of} {totalQuestions}
          </div>
        </div>

        <Progress value={progress} className="mt-2" />
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <QuestionRenderer
            question={currentQuestion}
            selectedAnswer={
              selectedOptions[currentQuestion.id] ||
              (currentQuestion.questionType === "MULTIPLE_CHOICE" ? [] :
               currentQuestion.questionType === "ORDERING" ? [] :
               currentQuestion.questionType === "MATCHING" ? [] :
               currentQuestion.questionType === "DROPDOWN" ? {} : "")
            }
            onAnswerChange={handleAnswerChange}
            language={language}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          {t.previous}
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered()}
            >
              {t.next}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!areAllQuestionsAnswered() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.submitQuiz}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

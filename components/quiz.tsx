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

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

import { AlertCircle, CheckCircle2, Trophy } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Badge } from "@/components/ui/badge";

import Link from "next/link";

import { SupportedLanguage } from "@/store/language-context";

interface Option {
  id: string;

  text: string;

  isCorrect: boolean;
}

interface Question {
  id: string;

  text: string;

  options: Option[];
}

interface Quiz {
  id: string;

  title: string;

  description: string | null;

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
    Record<string, string>
  >({});

  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [correctAnswers, setCorrectAnswers] = useState(0);

  const t = getTranslations(language);

  const prefix = language === "en" ? "" : `/${language}`;

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const totalQuestions = quiz.questions.length;

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleOptionChange = (questionId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,

      [questionId]: optionId,
    }));
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
  };

  const handleSubmit = () => {
    // Calculate score

    let score = 0;

    Object.keys(selectedOptions).forEach((questionId) => {
      const question = quiz.questions.find((q) => q.id === questionId);

      if (question) {
        const selectedOption = question.options.find(
          (o) => o.id === selectedOptions[questionId]
        );

        if (selectedOption?.isCorrect) {
          score++;
        }
      }
    });

    setCorrectAnswers(score);

    setQuizSubmitted(true);
  };

  const handleTryAgain = () => {
    setSelectedOptions({});

    setCurrentQuestionIndex(0);

    setQuizSubmitted(false);

    setCorrectAnswers(0);
  };

  const renderResultMessage = () => {
    const percentage = (correctAnswers / totalQuestions) * 100;

    if (percentage === 100) {
      return (
        <Alert className="bg-green-50 border-green-200 mb-6">
          <Trophy className="h-5 w-5 text-green-600" />

          <AlertTitle className="text-green-800 font-bold">
            {t.perfectScore}
          </AlertTitle>

          <AlertDescription className="text-green-700">
            {correctAnswers} / {totalQuestions} {t.correctAnswers}
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

          <AlertDescription className="text-blue-700">
            {correctAnswers} / {totalQuestions} {t.correctAnswers}
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

          <AlertDescription className="text-amber-700">
            {correctAnswers} / {totalQuestions} {t.correctAnswers}
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

          <div className="space-y-6">
            {quiz.questions.map((question) => {
              const selectedOptionId = selectedOptions[question.id];

              const isCorrect = !!question.options.find(
                (o) => o.id === selectedOptionId && o.isCorrect
              );

              return (
                <div key={question.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{question.text}</h3>

                    {selectedOptionId && (
                      <Badge variant={isCorrect ? "default" : "destructive"}>
                        {isCorrect ? t.correct : t.incorrect}
                      </Badge>
                    )}
                  </div>

                  <div className="ml-6 space-y-2">
                    {question.options.map((option) => {
                      const isSelected = selectedOptionId === option.id;

                      return (
                        <div
                          key={option.id}
                          className={cn(
                            "p-3 rounded-md border text-sm",

                            isSelected &&
                              option.isCorrect &&
                              "bg-green-50 border-green-200",

                            isSelected &&
                              !option.isCorrect &&
                              "bg-red-50 border-red-200",

                            !isSelected &&
                              option.isCorrect &&
                              "bg-blue-50 border-blue-200",

                            !isSelected && !option.isCorrect && "bg-muted"
                          )}
                        >
                          {option.text}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>

          <div className="text-sm text-muted-foreground">
            {t.question} {currentQuestionIndex + 1} {t.of} {totalQuestions}
          </div>
        </div>

        <Progress value={progress} className="mt-2" />
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-4">{currentQuestion.text}</h3>

          <RadioGroup
            value={selectedOptions[currentQuestion.id] || ""}
            onValueChange={(value) =>
              handleOptionChange(currentQuestion.id, value)
            }
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-muted/50"
              >
                <RadioGroupItem value={option.id} id={option.id} />

                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
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
              disabled={!selectedOptions[currentQuestion.id]}
            >
              {t.next}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(selectedOptions).length < totalQuestions}
            >
              {t.submitQuiz}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

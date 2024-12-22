"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2,  Trophy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  results: Array<{
    questionId: string;
    selectedOptionId: string;
    correctOptionId: string;
    isCorrect: boolean;
  }>;
}

interface QuizProps {
  id: string;
  title: string;
  description?: string | null;
  questions: Question[];
}

export default function QuizComponent({ id, title, description, questions }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizComplete, setQuizComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<QuizResult | null>(null);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/quizzes/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: selectedAnswers
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      setResults(result);
      setQuizComplete(true);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestionData = questions[currentQuestion];
  const hasSelectedAnswer = Boolean(selectedAnswers[currentQuestionData.id]);
  const isLastQuestion = currentQuestion === questions.length - 1;
  const allQuestionsAnswered = questions.every(q => selectedAnswers[q.id]);

  if (quizComplete && results) {
    const scorePercentage = (results.score).toFixed(1);
    const isPerfect = results.score === 100;
    const isGood = results.score >= 70;
    const isFailing = results.score < 50;

    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Quiz Complete!</CardTitle>
          <CardDescription>
            Here&apos;s how you did on the quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className={cn(
                  "w-16 h-16",
                  isPerfect ? "text-yellow-500" :
                  isGood ? "text-green-500" :
                  isFailing ? "text-red-500" : "text-blue-500"
                )} />
              </div>
              <Progress
                value={results.score}
                className="h-32 w-32 rounded-full [transform:rotate(-90deg)]"
              />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{scorePercentage}%</div>
              <div className="text-sm text-muted-foreground">
                {results.correctAnswers} out of {results.totalQuestions} questions correct
              </div>
            </div>
          </div>

          <Alert
            variant={isPerfect ? "default" : isGood ? "default" : "destructive"}
          >
            {isPerfect ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : isGood ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {isPerfect
                ? "Perfect Score!"
                : isGood
                ? "Well Done!"
                : "Keep Practicing"}
            </AlertTitle>
            <AlertDescription>
              {isPerfect
                ? "Congratulations! You've achieved a perfect score."
                : isGood
                ? "Great job! You've shown a good understanding of the material."
                : "Don't worry! Learning is a journey. Review the material and try again."}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2 justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/quizzes'}
          >
            Back to Quizzes
          </Button>
          <Button 
            variant="default"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
          <Progress value={progress} className="h-2" />
          <div className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">
            {currentQuestionData.text}
          </h3>
          <RadioGroup
            value={selectedAnswers[currentQuestionData.id]}
            onValueChange={handleAnswerSelect}
          >
            <div className="grid gap-4">
              {currentQuestionData.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent",
                    selectedAnswers[currentQuestionData.id] === option.id && "border-primary"
                  )}
                  onClick={() => handleAnswerSelect(option.id)}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-grow cursor-pointer"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {!hasSelectedAnswer && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Required</AlertTitle>
            <AlertDescription>
              Please select an answer before proceeding.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button
              onClick={handleNext}
              disabled={!hasSelectedAnswer}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
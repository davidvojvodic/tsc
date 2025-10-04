import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { QuizDetailPage } from "../../../_components/quiz-detail-page";
import type { OrderingConfiguration, MatchingConfiguration } from "@/components/quiz-editor/quiz-editor-layout";

async function getQuiz(id: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: {
            createdAt: "asc",
          }
        },
      },
    });
    
    return quiz;
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return null;
  }
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuiz(id);

  if (!quiz) {
    notFound();
  }
  
  // Transform the data to match the expected interface
  const transformedQuiz = {
    ...quiz,
    questions: quiz.questions
      .map(question => ({
        ...question,
        questionType: question.questionType as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING",
        options: question.options?.map(option => ({
          ...option,
          isCorrect: option.correct // Map 'correct' to 'isCorrect'
        })) || [],
        // Transform answersData to multipleChoiceData for multiple choice questions
        multipleChoiceData: question.questionType === "MULTIPLE_CHOICE" && question.answersData
          ? question.answersData as {
              scoringMethod: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
              minSelections: number;
              maxSelections?: number;
              partialCreditRules?: {
                correctSelectionPoints: number;
                incorrectSelectionPenalty: number;
                minScore: number;
              };
            }
          : undefined,
        // Transform answersData to textInputData for text input questions
        textInputData: question.questionType === "TEXT_INPUT" && question.answersData
          ? question.answersData as {
              acceptableAnswers: string[];
              caseSensitive: boolean;
              placeholder?: string;
              placeholder_sl?: string;
              placeholder_hr?: string;
            }
          : undefined,
        // Transform answersData to dropdownData for dropdown questions
        dropdownData: question.questionType === "DROPDOWN" && question.answersData
          ? question.answersData as {
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
                  text: string;
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
            }
          : undefined,
        // Transform answersData to orderingData for ordering questions
        orderingData: question.questionType === "ORDERING" && question.answersData
          ? question.answersData as unknown as OrderingConfiguration
          : undefined,
        // Transform answersData to matchingData for matching questions
        matchingData: question.questionType === "MATCHING" && question.answersData
          ? question.answersData as unknown as MatchingConfiguration
          : undefined
      }))
  };

  return <QuizDetailPage quiz={transformedQuiz} language="sl" />;
}
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MultipleChoiceDataType, TextInputDataType, DropdownDataType, OrderingDataType, MatchingDataType } from "@/lib/schemas/quiz";
import { QuizData } from "@/components/quiz-editor/quiz-editor-layout";
import QuizPageClient from "./quiz-page-client";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Check if user has quiz access (admin or teacher)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    redirect("/");
  }

  // Await params before using
  const { id } = await params;

  // Fetch all teachers for the form
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch existing quiz if we're editing
  const quiz =
    id !== "new"
      ? await prisma.quiz.findUnique({
          where: { id },
          include: {
            questions: {
              include: {
                options: {
                  orderBy: {
                    id: "asc",
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        })
      : null;

  const formattedQuiz = quiz
    ? {
        id: quiz.id,
        title: quiz.title,
        title_sl: quiz.title_sl ?? undefined,
        title_hr: quiz.title_hr ?? undefined,
        description: quiz.description ?? "",
        description_sl: quiz.description_sl ?? undefined,
        description_hr: quiz.description_hr ?? undefined,
        teacherId: quiz.teacherId,
        questions: quiz.questions
          .map((question) => {
            // Debug logging for DROPDOWN and ORDERING questions
            if (question.questionType === "DROPDOWN" || question.questionType === "ORDERING") {
              console.log(`[DEBUG] Loading ${question.questionType} question:`, {
                questionId: question.id,
                answersData: JSON.stringify(question.answersData, null, 2)
              });
            }

            return {
              id: question.id,
              text: question.text,
              text_sl: question.text_sl ?? undefined,
              text_hr: question.text_hr ?? undefined,
              imageUrl: question.imageUrl ?? undefined,
              questionType: question.questionType as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING",
              options: (question.questionType === "TEXT_INPUT" || question.questionType === "MATCHING") ? [] : question.options.map((option) => ({
                id: option.id,
                text: option.text,
                text_sl: option.text_sl ?? undefined,
                text_hr: option.text_hr ?? undefined,
                isCorrect: option.correct,
                // Build content object from database fields for proper UI rendering
                content: {
                  type: (option.contentType as "text" | "mixed") || "text",
                  text: option.text || "",
                  text_sl: option.text_sl || "",
                  text_hr: option.text_hr || "",
                  ...(option.contentType === "mixed" && option.imageUrl && {
                    imageUrl: option.imageUrl,
                  }),
                },
              })),
              multipleChoiceData: question.questionType === "MULTIPLE_CHOICE" && question.answersData
                ? (question.answersData as MultipleChoiceDataType)
                : undefined,
              textInputData: question.questionType === "TEXT_INPUT" && question.answersData
                ? (question.answersData as TextInputDataType)
                : undefined,
              dropdownData: question.questionType === "DROPDOWN" && question.answersData
                ? (question.answersData as DropdownDataType)
                : undefined,
              orderingData: question.questionType === "ORDERING" && question.answersData
                ? (question.answersData as OrderingDataType)
                : undefined,
              matchingData: question.questionType === "MATCHING" && question.answersData
                ? (question.answersData as unknown as MatchingDataType)
                : undefined,
            };
          }),
      } as QuizData
    : undefined;

  return (
    <QuizPageClient
      teachers={teachers}
      initialData={formattedQuiz}
      quizId={id}
    />
  );
}
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MultipleChoiceDataType } from "@/lib/schemas/quiz";
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
                id: "asc",
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
          .filter(question => question.questionType === "SINGLE_CHOICE" || question.questionType === "MULTIPLE_CHOICE")
          .map((question) => ({
            id: question.id,
            text: question.text,
            text_sl: question.text_sl ?? undefined,
            text_hr: question.text_hr ?? undefined,
            questionType: question.questionType as "SINGLE_CHOICE" | "MULTIPLE_CHOICE",
            options: question.options.map((option) => ({
              id: option.id,
              text: option.text,
              text_sl: option.text_sl ?? undefined,
              text_hr: option.text_hr ?? undefined,
              isCorrect: option.correct,
            })),
            multipleChoiceData: question.answersData ? (question.answersData as MultipleChoiceDataType) : undefined,
          })),
      }
    : undefined;

  return (
    <QuizPageClient
      teachers={teachers}
      initialData={formattedQuiz}
      quizId={id}
    />
  );
}
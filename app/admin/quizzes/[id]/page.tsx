import prisma from "@/lib/prisma";
import { QuizForm } from "@/components/forms/quiz-form";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { checkAdminAccess } from "@/lib/utils";

export default async function QuizPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAuthorized = await checkAdminAccess(session.user.id);
  if (!isAuthorized) {
    redirect("/");
  }

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
    params.id !== "new"
      ? await prisma.quiz.findUnique({
          where: { id: params.id },
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
        description: quiz.description,
        teacherId: quiz.teacherId,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          text: question.text,
          options: question.options.map((option) => ({
            id: option.id,
            text: option.text,
            correct: option.correct,
          })),
        })),
      }
    : undefined;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <QuizForm teachers={teachers} initialData={formattedQuiz} />
      </div>
    </div>
  );
}
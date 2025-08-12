// app/admin/quizzes/page.tsx
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { QuizClient } from "./components/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN" || user?.role === "TEACHER";
}

export default async function QuizzesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAuthorized = await checkAdminAccess(session.user.id);
  if (!isAuthorized) {
    redirect("/");
  }

  const quizzes = await prisma.quiz.findMany({
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
      questions: {
        select: {
          id: true,
        },
      },
      submissions: {
        select: {
          score: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedQuizzes = quizzes.map((quiz) => {
    const submissionCount = quiz.submissions.length;
    const averageScore = submissionCount > 0
      ? quiz.submissions.reduce((acc, sub) => acc + sub.score, 0) / submissionCount
      : null;

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      teacher: quiz.teacher,
      questionCount: quiz.questions.length,
      submissionCount,
      averageScore,
      createdAt: format(quiz.createdAt, "MMMM do, yyyy"),
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <QuizClient data={formattedQuizzes} />
      </div>
    </div>
  );
}
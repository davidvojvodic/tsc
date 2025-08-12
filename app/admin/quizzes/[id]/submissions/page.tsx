// app/admin/quizzes/[id]/submissions/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { submissionColumns, type QuizAnswer } from "./columns";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN" || user?.role === "TEACHER";
}

async function getQuizWithSubmissions(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      teacher: {
        select: {
          name: true,
        },
      },
      questions: {
        select: {
          id: true,
        },
      },
      submissions: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export default async function QuizSubmissionsPage({
  params,
}: {
  params: { id: string };
}) {
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

  const quiz = await getQuizWithSubmissions(params.id);
  if (!quiz) {
    redirect("/admin/quizzes");
  }

  // Calculate statistics
  const totalSubmissions = quiz.submissions.length;
  const averageScore = totalSubmissions > 0
    ? quiz.submissions.reduce((acc, sub) => acc + sub.score, 0) / totalSubmissions
    : 0;
  const highestScore = totalSubmissions > 0
    ? Math.max(...quiz.submissions.map(s => s.score))
    : 0;
  const lowestScore = totalSubmissions > 0
    ? Math.min(...quiz.submissions.map(s => s.score))
    : 0;

  // Format submissions for the data table
  const formattedSubmissions = quiz.submissions.map((submission) => ({
    id: submission.id,
    userName: submission.user.name || "Unknown",
    userEmail: submission.user.email,
    score: submission.score,
    submittedAt: format(submission.createdAt, "PPpp"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: (submission.answers as any[]).map((answer) => ({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      correctOptionId: answer.correctOptionId,
      isCorrect: answer.isCorrect,
    })) as QuizAnswer[],
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/quizzes">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{quiz.title}</h2>
              <p className="text-sm text-muted-foreground">
                View all submissions for this quiz
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubmissions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
              <Progress value={averageScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Highest Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highestScore.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lowest Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowestScore.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              A list of all students who have taken this quiz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={submissionColumns} 
              data={formattedSubmissions} 
              searchKey="userEmail"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
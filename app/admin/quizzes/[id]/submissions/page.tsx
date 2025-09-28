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
          text: true,
          text_sl: true,
          text_hr: true,
          questionType: true,
          answersData: true,
          createdAt: true,
          options: {
            select: {
              id: true,
              text: true,
              text_sl: true,
              text_hr: true,
              correct: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
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
  params: Promise<{ id: string }>;
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

  // Await params before using
  const { id } = await params;

  const quiz = await getQuizWithSubmissions(id);
  if (!quiz) {
    redirect("/admin/quizzes");
  }

  // Create lookup maps for questions and options
  const questionsMap = new Map();
  const optionsMap = new Map();

  quiz.questions.forEach((question, index) => {
    questionsMap.set(question.id, {
      ...question,
      displayOrder: index + 1, // For proper ordering in display
    });

    question.options.forEach((option) => {
      optionsMap.set(option.id, option);
    });
  });

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
  const formattedSubmissions = quiz.submissions.map((submission) => {
    // Handle the answers structure - it's stored as JSON object, not array
    const submissionData = submission.answers as any;
    let answersArray: QuizAnswer[] = [];

    if (submissionData) {
      if (submissionData.version === "2.0" && submissionData.scoreDetails?.questionResults) {
        // New format with detailed scoring
        answersArray = submissionData.scoreDetails.questionResults.map((result: any) => {
          const question = questionsMap.get(result.questionId);
          const selectedAnswerIds = Array.isArray(result.selectedAnswers) ? result.selectedAnswers : [result.selectedAnswers];
          const correctAnswerIds = Array.isArray(result.correctAnswers) ? result.correctAnswers : [result.correctAnswers];

          // Handle different question types differently
          let selectedAnswersText: string[];
          let correctAnswersText: string[];

          if (question?.questionType === "TEXT_INPUT") {
            // For TEXT_INPUT questions, the answers are direct text values, not option IDs
            selectedAnswersText = selectedAnswerIds.filter(Boolean);
            correctAnswersText = correctAnswerIds.filter(Boolean);
          } else {
            // For choice questions, look up option text by ID
            selectedAnswersText = selectedAnswerIds.map((id: string) => {
              const option = optionsMap.get(id);
              return option?.text || id;
            });
            correctAnswersText = correctAnswerIds.map((id: string) => {
              const option = optionsMap.get(id);
              return option?.text || id;
            });
          }

          return {
            questionId: result.questionId,
            questionText: question?.text || `Question ${question?.displayOrder || '?'}`,
            questionOrder: question?.displayOrder || 0,
            questionType: question?.questionType || 'UNKNOWN',
            selectedOptionId: Array.isArray(result.selectedAnswers) ? null : result.selectedAnswers,
            selectedAnswers: selectedAnswerIds,
            selectedAnswersText,
            correctAnswers: correctAnswerIds,
            correctAnswersText,
            isCorrect: result.isCorrect,
            score: result.score,
            maxScore: result.maxScore,
          };
        });
      } else if (Array.isArray(submissionData)) {
        // Legacy format (array)
        answersArray = submissionData.map((answer: any) => {
          const question = questionsMap.get(answer.questionId);

          // Handle different question types differently for legacy format
          let selectedAnswersText: string[];
          let correctAnswersText: string[];

          if (question?.questionType === "TEXT_INPUT") {
            // For TEXT_INPUT questions, use the answer values directly
            selectedAnswersText = [answer.selectedOptionId || ''];
            correctAnswersText = [answer.correctOptionId || ''];
          } else {
            // For choice questions, look up option text by ID
            const selectedOption = optionsMap.get(answer.selectedOptionId);
            const correctOption = optionsMap.get(answer.correctOptionId);
            selectedAnswersText = [selectedOption?.text || answer.selectedOptionId];
            correctAnswersText = [correctOption?.text || answer.correctOptionId];
          }

          return {
            questionId: answer.questionId,
            questionText: question?.text || `Question ${question?.displayOrder || '?'}`,
            questionOrder: question?.displayOrder || 0,
            questionType: question?.questionType || 'UNKNOWN',
            selectedOptionId: answer.selectedOptionId,
            selectedAnswers: [answer.selectedOptionId],
            selectedAnswersText,
            correctAnswers: [answer.correctOptionId],
            correctAnswersText,
            isCorrect: answer.isCorrect,
          };
        });
      }
    }

    return {
      id: submission.id,
      userName: submission.user.name || "Unknown",
      userEmail: submission.user.email,
      score: submission.score,
      submittedAt: format(submission.createdAt, "PPpp"),
      answers: answersArray,
    };
  });

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
              searchKey="userName"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
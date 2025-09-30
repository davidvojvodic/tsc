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

  // Create lookup maps for questions, options, and ordering items
  const questionsMap = new Map();
  const optionsMap = new Map();
  const orderingItemsMap = new Map(); // Map of questionId -> Map of itemId -> item content text

  quiz.questions.forEach((question, index) => {
    questionsMap.set(question.id, {
      ...question,
      displayOrder: index + 1, // For proper ordering in display
    });

    question.options.forEach((option) => {
      optionsMap.set(option.id, option);
    });

    // Handle ORDERING questions - build a map of item IDs to their content
    if (question.questionType === "ORDERING" && question.answersData) {
      const orderingData = question.answersData as Record<string, unknown>;
      if (orderingData.items && Array.isArray(orderingData.items)) {
        const itemsMap = new Map();
        orderingData.items.forEach((item: Record<string, unknown>) => {
          // Get the text content based on item type
          let contentText = "";
          const content = item.content as Record<string, unknown>;
          const contentType = content.type as string;

          if (contentType === "text") {
            contentText = (content.text as string) || (item.id as string);
          } else if (contentType === "image") {
            contentText = (content.altText as string) || "Image";
          } else if (contentType === "mixed") {
            contentText = (content.text as string) || "Mixed content";
          }
          itemsMap.set(item.id as string, {
            text: contentText,
            correctPosition: item.correctPosition as number
          });
        });
        orderingItemsMap.set(question.id, itemsMap);
      }
    }
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
    const submissionData = submission.answers as Record<string, unknown>;
    let answersArray: QuizAnswer[] = [];

    if (submissionData) {
      const scoreDetails = submissionData.scoreDetails as Record<string, unknown> | undefined;
      const questionResults = scoreDetails?.questionResults as Record<string, unknown>[] | undefined;

      if (submissionData.version === "2.0" && questionResults) {
        // New format with detailed scoring
        answersArray = questionResults.map((result: Record<string, unknown>) => {
          const question = questionsMap.get(result.questionId as string);
          const selectedAnswerIds = Array.isArray(result.selectedAnswers) ? result.selectedAnswers as string[] : [result.selectedAnswers as string];
          const correctAnswerIds = Array.isArray(result.correctAnswers) ? result.correctAnswers as string[] : [result.correctAnswers as string];

          // Handle different question types differently
          let selectedAnswersText: string[];
          let correctAnswersText: string[];

          if (question?.questionType === "TEXT_INPUT") {
            // For TEXT_INPUT questions, the answers are direct text values, not option IDs
            selectedAnswersText = selectedAnswerIds.filter(Boolean);
            correctAnswersText = correctAnswerIds.filter(Boolean);
          } else if (question?.questionType === "ORDERING") {
            // For ORDERING questions, map item IDs to their content text and show positions
            const itemsMap = orderingItemsMap.get(result.questionId);
            selectedAnswersText = selectedAnswerIds.map((id: string, index: number) => {
              const item = itemsMap?.get(id);
              return item ? `${index + 1}. ${item.text}` : `${index + 1}. ${id}`;
            });
            correctAnswersText = correctAnswerIds.map((id: string, index: number) => {
              const item = itemsMap?.get(id);
              return item ? `${index + 1}. ${item.text}` : `${index + 1}. ${id}`;
            });
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
            questionId: result.questionId as string,
            questionText: question?.text || `Question ${question?.displayOrder || '?'}`,
            questionOrder: question?.displayOrder || 0,
            questionType: question?.questionType || 'UNKNOWN',
            selectedOptionId: Array.isArray(result.selectedAnswers) ? null : (result.selectedAnswers as string | null),
            selectedAnswers: selectedAnswerIds,
            selectedAnswersText,
            correctAnswers: correctAnswerIds,
            correctAnswersText,
            isCorrect: result.isCorrect as boolean,
            score: result.score as number | undefined,
            maxScore: result.maxScore as number | undefined,
          };
        });
      } else if (Array.isArray(submissionData)) {
        // Legacy format (array)
        answersArray = submissionData.map((answer: Record<string, unknown>) => {
          const question = questionsMap.get(answer.questionId as string);

          // Handle different question types differently for legacy format
          let selectedAnswersText: string[];
          let correctAnswersText: string[];

          if (question?.questionType === "TEXT_INPUT") {
            // For TEXT_INPUT questions, use the answer values directly
            selectedAnswersText = [(answer.selectedOptionId as string) || ''];
            correctAnswersText = [(answer.correctOptionId as string) || ''];
          } else if (question?.questionType === "ORDERING") {
            // For ORDERING questions in legacy format - unlikely but handle it
            const itemsMap = orderingItemsMap.get(answer.questionId as string);
            const selectedIds = Array.isArray(answer.selectedOptionId) ? answer.selectedOptionId as string[] : [answer.selectedOptionId as string];
            const correctIds = Array.isArray(answer.correctOptionId) ? answer.correctOptionId as string[] : [answer.correctOptionId as string];

            selectedAnswersText = selectedIds.map((id: string, index: number) => {
              const item = itemsMap?.get(id);
              return item ? `${index + 1}. ${item.text}` : `${index + 1}. ${id}`;
            });
            correctAnswersText = correctIds.map((id: string, index: number) => {
              const item = itemsMap?.get(id);
              return item ? `${index + 1}. ${item.text}` : `${index + 1}. ${id}`;
            });
          } else {
            // For choice questions, look up option text by ID
            const selectedOption = optionsMap.get(answer.selectedOptionId as string);
            const correctOption = optionsMap.get(answer.correctOptionId as string);
            selectedAnswersText = [selectedOption?.text || (answer.selectedOptionId as string)];
            correctAnswersText = [correctOption?.text || (answer.correctOptionId as string)];
          }

          return {
            questionId: answer.questionId as string,
            questionText: question?.text || `Question ${question?.displayOrder || '?'}`,
            questionOrder: question?.displayOrder || 0,
            questionType: question?.questionType || 'UNKNOWN',
            selectedOptionId: answer.selectedOptionId as string | null,
            selectedAnswers: [answer.selectedOptionId as string],
            selectedAnswersText,
            correctAnswers: [answer.correctOptionId as string],
            correctAnswersText,
            isCorrect: answer.isCorrect as boolean,
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
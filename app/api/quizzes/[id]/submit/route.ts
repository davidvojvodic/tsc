// app/api/quizzes/[id]/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { quizSubmissionSchema } from "@/lib/schemas/quiz";
import { scoreQuiz, type QuestionData } from "@/lib/quiz-scoring";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Get quiz with all question data needed for scoring
    const quiz = await prisma.quiz.findUnique({
      where: {
        id
      },
      include: {
        questions: {
          include: {
            options: {
              select: {
                id: true,
                correct: true,
              }
            },
          },
        },
      },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    // Validate request body
    const body = await req.json();
    const { answers } = quizSubmissionSchema.parse(body);

    // Transform quiz questions to scoring format
    const questionData: QuestionData[] = quiz.questions.map(question => ({
      id: question.id,
      questionType: question.questionType,
      answersData: question.answersData ? (question.answersData as Record<string, unknown>) : undefined,
      options: question.options,
      correctOptionId: question.correctOptionId,
    }));

    // Calculate score using the new scoring system
    const scoreResult = scoreQuiz(questionData, answers);

    // Transform results for backward compatibility
    const legacyResults = scoreResult.questionResults.map(result => ({
      questionId: result.questionId,
      selectedOptionId: Array.isArray(result.selectedAnswers)
        ? result.selectedAnswers
        : result.selectedAnswers,
      correctOptionId: Array.isArray(result.correctAnswers)
        ? result.correctAnswers
        : result.correctAnswers,
      isCorrect: result.isCorrect,
      score: result.score,
      maxScore: result.maxScore,
      explanation: result.explanation,
    }));

    // Save submission if user is authenticated
    if (session?.user) {
      try {
        await prisma.quizSubmission.create({
          data: {
            quizId: id,
            userId: session.user.id,
            score: scoreResult.percentage, // Store as percentage for backward compatibility
            answers: JSON.parse(JSON.stringify({
              submittedAnswers: answers,
              scoreDetails: scoreResult,
              version: "2.0", // Mark as new scoring version
            })),
          },
        });
      } catch (error) {
        console.error("[QUIZ_SUBMISSION_SAVE]", error);
        // Continue even if saving fails - we still want to return the results
      }
    }

    // Return comprehensive results
    return NextResponse.json({
      // Legacy format for backward compatibility
      score: scoreResult.percentage,
      totalQuestions: scoreResult.totalQuestions,
      correctAnswers: scoreResult.correctQuestions,
      results: legacyResults,

      // New detailed scoring information
      scoring: {
        totalScore: scoreResult.totalScore,
        maxTotalScore: scoreResult.maxTotalScore,
        percentage: scoreResult.percentage,
        correctQuestions: scoreResult.correctQuestions,
        totalQuestions: scoreResult.totalQuestions,
        questionResults: scoreResult.questionResults,
      }
    });
  } catch (error) {
    console.error("[QUIZ_SUBMISSION]", error);

    // Handle specific scoring errors
    if (error instanceof Error && error.message.includes("question")) {
      return NextResponse.json(
        { error: "Invalid quiz configuration", details: error.message },
        { status: 422 }
      );
    }

    // Handle validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: "Invalid submission format", issues: error.issues },
        { status: 422 }
      );
    }

    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}
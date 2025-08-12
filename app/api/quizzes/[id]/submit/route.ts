// app/api/quizzes/[id]/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";

// Validation schema for quiz submission
const submissionSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

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

    // Get quiz with correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { 
        id 
      },
      include: {
        questions: {
          include: {
            options: true,
            correctOption: true,
          },
        },
      },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    // Validate request body
    const body = await req.json();
    const { answers } = submissionSchema.parse(body);

    // Calculate score
    let correctAnswers = 0;
    const results = quiz.questions.map((question) => {
      const selectedOptionId = answers[question.id];
      const isCorrect = selectedOptionId === question.correctOptionId;
      if (isCorrect) correctAnswers++;

      return {
        questionId: question.id,
        selectedOptionId,
        correctOptionId: question.correctOptionId,
        isCorrect,
      };
    });

    // Calculate percentage
    const score = (correctAnswers / quiz.questions.length) * 100;

    // Save submission if user is authenticated
    if (session?.user) {
      try {
        await prisma.quizSubmission.create({
          data: {
            quizId: id,
            userId: session.user.id,
            score,
            answers: results, // Store the detailed results
          },
        });
      } catch (error) {
        console.error("[QUIZ_SUBMISSION_SAVE]", error);
        // Continue even if saving fails - we still want to return the results
      }
    }

    // Return results to the client
    return NextResponse.json({
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      results,
    });
  } catch (error) {
    console.error("[QUIZ_SUBMISSION]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }

    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}
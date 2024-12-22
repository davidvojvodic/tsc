// app/api/quizzes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client"; // Import Prisma types

// ----------------------
// TypeScript Interfaces
// ----------------------

interface OptionInput {
  text: string;
  correct: boolean;
}

interface QuestionInput {
  text: string;
  options: OptionInput[];
}

interface QuizInput {
  title: string;
  description?: string;
  teacherId: string;
  questions: QuestionInput[];
}

// ----------------------
// Zod Validation Schemas
// ----------------------

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  correct: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z.array(optionSchema).min(2, "At least 2 options are required"),
});

const quizSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z.string().optional(),
  teacherId: z.string().min(1, "Please select a teacher"),
  questions: z.array(questionSchema).min(1, "At least 1 question is required"),
});

// ----------------------
// Helper Functions
// ----------------------

/**
 * Checks if a user has admin or teacher access.
 * @param userId - The ID of the user to check.
 * @returns A boolean indicating if the user is authorized.
 */
async function checkAdminAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN" || user?.role === "TEACHER";
}

/**
 * Creates a question along with its options within a transaction.
 * @param tx - The Prisma transaction client.
 * @param quizId - The ID of the quiz to which the question belongs.
 * @param questionData - The data for the question and its options.
 * @returns The created question with its options and the correct option.
 */
async function createQuestion(
  tx: Prisma.TransactionClient,
  quizId: string,
  questionData: QuestionInput
) {
  // Step 1: Create the question without setting correctOptionId
  const question = await tx.question.create({
    data: {
      text: questionData.text,
      quizId: quizId,
      // correctOptionId is optional and will be set later
    },
  });

  // Step 2: Create all options associated with the question
  const options = await Promise.all(
    questionData.options.map((opt) =>
      tx.option.create({
        data: {
          text: opt.text,
          correct: opt.correct,
          questionId: question.id, // Associate with the created question
        },
      })
    )
  );

  // Step 3: Identify the correct option
  const correctOption = options.find((opt) => opt.correct);
  if (!correctOption) {
    throw new Error("No correct option specified for a question.");
  }

  // Step 4: Update the question with the correctOptionId
  await tx.question.update({
    where: { id: question.id },
    data: { correctOptionId: correctOption.id },
  });

  // Step 5: Retrieve and return the complete question with relations
  return await tx.question.findUnique({
    where: { id: question.id },
    include: {
      options: true,
      correctOption: true,
    },
  });
}

// ----------------------
// POST Handler
// ----------------------

export async function POST(req: NextRequest) {
  try {
    // Step 1: Authenticate the user
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Step 2: Check if the user has admin or teacher access
    const isAuthorized = await checkAdminAccess(session.user.id);
    if (!isAuthorized) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Step 3: Parse and validate the request body
    const body: QuizInput = await req.json();
    const validatedData = quizSchema.parse(body);

    // Step 4: Create the quiz and its related questions within a transaction
    const quiz = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 4.1: Create the quiz
      const createdQuiz = await tx.quiz.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          teacherId: validatedData.teacherId,
        },
      });

      // 4.2: Create each question with its options
      for (const questionData of validatedData.questions) {
        await createQuestion(tx, createdQuiz.id, questionData);
      }

      // 4.3: Retrieve and return the complete quiz with all relations
      return tx.quiz.findUnique({
        where: { id: createdQuiz.id },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
          questions: {
            include: {
              options: true,
              correctOption: true,
            },
          },
        },
      });
    });

    // Step 5: Respond with the created quiz data
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZZES_POST]", error);

    // Handle validation errors from Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }

    // Handle other types of errors
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

// ----------------------
// GET Handler
// ----------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  try {
    // Step 1: Authenticate the user
    const session = await auth.api.getSession({
      headers: headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Step 2: Check if the user has admin or teacher access
    const isAuthorized = await checkAdminAccess(session.user.id);
    if (!isAuthorized) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Step 3: Retrieve all quizzes with related data
    const quizzes = await prisma.quiz.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        questions: {
          include: {
            options: true,
            correctOption: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Step 4: Respond with the retrieved quizzes
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("[QUIZZES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

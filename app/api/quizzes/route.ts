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
  text_sl?: string;
  text_hr?: string;
  isCorrect: boolean; // Changed from 'correct' to match form data
}

interface QuestionInput {
  text: string;
  text_sl?: string;
  text_hr?: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING" | "DRAG_DROP_IMAGE";
  options: OptionInput[];
  multipleChoiceData?: {
    scoringMethod: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
    minSelections: number;
    maxSelections?: number;
    partialCreditRules?: {
      correctSelectionPoints: number;
      incorrectSelectionPenalty: number;
      minScore: number;
    };
  };
}

interface QuizInput {
  title: string;
  title_sl?: string;
  title_hr?: string;
  description?: string;
  description_sl?: string;
  description_hr?: string;
  teacherId: string;
  questions: QuestionInput[];
}

// ----------------------
// Zod Validation Schemas
// ----------------------

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  isCorrect: z.boolean().optional().default(false), // Make optional with default value
});

const multipleChoiceDataSchema = z.object({
  scoringMethod: z.enum(["ALL_OR_NOTHING", "PARTIAL_CREDIT"]).default("ALL_OR_NOTHING"),
  minSelections: z.number().min(1).default(1),
  maxSelections: z.number().min(1).optional(),
  partialCreditRules: z.object({
    correctSelectionPoints: z.number().default(1),
    incorrectSelectionPenalty: z.number().default(0),
    minScore: z.number().default(0),
  }).optional(),
});

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  questionType: z.enum([
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "TEXT_INPUT",
    "DROPDOWN",
    "ORDERING",
    "MATCHING",
    "DRAG_DROP_IMAGE"
  ]).default("SINGLE_CHOICE"),
  options: z.array(optionSchema).min(2, "At least 2 options are required"),
  multipleChoiceData: multipleChoiceDataSchema.optional(),
}).refine(
  (data) => {
    // For SINGLE_CHOICE, exactly one option must be correct
    if (data.questionType === "SINGLE_CHOICE") {
      const correctCount = data.options.filter(opt => opt.isCorrect).length;
      return correctCount === 1;
    }
    // For MULTIPLE_CHOICE, at least one option must be correct
    if (data.questionType === "MULTIPLE_CHOICE") {
      const correctCount = data.options.filter(opt => opt.isCorrect).length;
      return correctCount >= 1;
    }
    return true;
  },
  {
    message: "Invalid number of correct options for the question type",
  }
);

const quizSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  title_sl: z.string().optional(),
  title_hr: z.string().optional(),
  description: z.string().optional(),
  description_sl: z.string().optional(),
  description_hr: z.string().optional(),
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
async function checkQuizAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user ? (user.role === "ADMIN" || user.role === "TEACHER") : false;
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
  // Prepare answersData for MULTIPLE_CHOICE questions
  let answersData = null;
  if (questionData.questionType === "MULTIPLE_CHOICE" && questionData.multipleChoiceData) {
    answersData = questionData.multipleChoiceData;
  }

  // Step 1: Create the question without setting correctOptionId
  const question = await tx.question.create({
    data: {
      text: questionData.text,
      text_sl: questionData.text_sl,
      text_hr: questionData.text_hr,
      questionType: questionData.questionType,
      answersData: answersData,
      quizId: quizId,
      // correctOptionId is optional and will be set later for SINGLE_CHOICE
    },
  });

  // Step 2: Create all options associated with the question
  const options = await Promise.all(
    questionData.options.map((opt) =>
      tx.option.create({
        data: {
          text: opt.text,
          text_sl: opt.text_sl,
          text_hr: opt.text_hr,
          correct: opt.isCorrect, // Map isCorrect to correct field in database
          questionId: question.id, // Associate with the created question
        },
      })
    )
  );

  // Step 3: For SINGLE_CHOICE questions, identify and set the correct option
  if (questionData.questionType === "SINGLE_CHOICE") {
    const correctOption = options.find((opt) => opt.correct);
    if (!correctOption) {
      throw new Error("No correct option specified for a single choice question.");
    }

    // Step 4: Update the question with the correctOptionId
    await tx.question.update({
      where: { id: question.id },
      data: { correctOptionId: correctOption.id },
    });
  }

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
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Step 2: Check if the user has admin or teacher access
    const isAuthorized = await checkQuizAccess(session.user.id);
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
          title_sl: validatedData.title_sl,
          title_hr: validatedData.title_hr,
          description: validatedData.description,
          description_sl: validatedData.description_sl,
          description_hr: validatedData.description_hr,
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
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Step 2: Check if the user has admin or teacher access
    const isAuthorized = await checkQuizAccess(session.user.id);
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

// app/api/quizzes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client"; // Import Prisma types
import { quizSchema } from "@/lib/schemas/quiz"; // Import centralized schema

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
  imageUrl?: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT" | "DROPDOWN" | "ORDERING" | "MATCHING" | "DRAG_DROP_IMAGE";
  options?: OptionInput[]; // Made optional for TEXT_INPUT and DROPDOWN questions
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
  textInputData?: {
    inputType?: "text" | "number" | "email" | "url"; // Optional for backward compatibility
    acceptableAnswers: string[];
    caseSensitive: boolean;
    numericTolerance?: number;
    placeholder?: string;
    placeholder_sl?: string;
    placeholder_hr?: string;
  };
  dropdownData?: {
    template: string;
    template_sl?: string;
    template_hr?: string;
    dropdowns: Array<{
      id: string;
      label: string;
      label_sl?: string;
      label_hr?: string;
      options: Array<{
        id: string;
        text: string;
        text_sl?: string;
        text_hr?: string;
        isCorrect: boolean;
      }>;
    }>;
    scoring?: {
      pointsPerDropdown: number;
      requireAllCorrect: boolean;
      penalizeIncorrect: boolean;
    };
  };
  orderingData?: {
    instructions: string;
    instructions_sl?: string;
    instructions_hr?: string;
    items: Array<{
      id: string;
      content: {
        type: "text" | "image" | "mixed";
        text?: string;
        text_sl?: string;
        text_hr?: string;
        imageUrl?: string;
        altText?: string;
        altText_sl?: string;
        altText_hr?: string;
        suffix?: string;
        suffix_sl?: string;
        suffix_hr?: string;
      };
      correctPosition: number;
    }>;
    allowPartialCredit?: boolean;
    exactOrderRequired?: boolean;
  };
  matchingData?: {
    instructions: string;
    instructions_sl?: string;
    instructions_hr?: string;
    matchingType: "one-to-one";
    leftItems: Array<{
      id: string;
      position: number;
      content: {
        type: "text" | "image" | "mixed";
        text?: string;
        text_sl?: string;
        text_hr?: string;
        imageUrl?: string;
        altText?: string;
        altText_sl?: string;
        altText_hr?: string;
        suffix?: string;
        suffix_sl?: string;
        suffix_hr?: string;
      };
    }>;
    rightItems: Array<{
      id: string;
      position: number;
      content: {
        type: "text" | "image" | "mixed";
        text?: string;
        text_sl?: string;
        text_hr?: string;
        imageUrl?: string;
        altText?: string;
        altText_sl?: string;
        altText_hr?: string;
        suffix?: string;
        suffix_sl?: string;
        suffix_hr?: string;
      };
    }>;
    correctMatches: Array<{
      leftId: string;
      rightId: string;
      explanation?: string;
      explanation_sl?: string;
      explanation_hr?: string;
    }>;
    distractors?: string[];
    scoring?: {
      pointsPerMatch: number;
      penalizeIncorrect: boolean;
      penaltyPerIncorrect: number;
      requireAllMatches: boolean;
      partialCredit: boolean;
    };
    display?: {
      connectionStyle: "line" | "arrow" | "dashed";
      connectionColor: string;
      correctColor: string;
      incorrectColor: string;
      showConnectionLabels: boolean;
      animateConnections: boolean;
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

// Note: Using centralized schema validation from @/lib/schemas/quiz

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
  // Prepare answersData for different question types
  let answersData = undefined;
  if (questionData.questionType === "MULTIPLE_CHOICE" && questionData.multipleChoiceData) {
    answersData = questionData.multipleChoiceData;
  }

  // For TEXT_INPUT questions, store textInputData in answersData field
  if (questionData.questionType === "TEXT_INPUT" && questionData.textInputData) {
    answersData = questionData.textInputData;
  }

  // For DROPDOWN questions, store dropdownData in answersData field
  if (questionData.questionType === "DROPDOWN" && questionData.dropdownData) {
    answersData = questionData.dropdownData;
  }

  // For ORDERING questions, store orderingData in answersData field
  if (questionData.questionType === "ORDERING" && questionData.orderingData) {
    answersData = questionData.orderingData;
  }

  // For MATCHING questions, store matchingData in answersData field
  if (questionData.questionType === "MATCHING" && questionData.matchingData) {
    answersData = questionData.matchingData;
  }

  // Step 1: Create the question without setting correctOptionId
  const question = await tx.question.create({
    data: {
      text: questionData.text,
      text_sl: questionData.text_sl,
      text_hr: questionData.text_hr,
      imageUrl: questionData.imageUrl,
      questionType: questionData.questionType,
      answersData: answersData,
      quizId: quizId,
      // correctOptionId is optional and will be set later for SINGLE_CHOICE
    },
  });

  // Step 2: Create all options associated with the question (if any)
  // Only create options for choice-based questions
  const shouldCreateOptions = ["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(questionData.questionType);
  const options = shouldCreateOptions && questionData.options ? await Promise.all(
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
  ) : [];

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

    if (process.env.NODE_ENV === 'development') {
      console.log("[QUIZZES_POST] Received quiz data:", JSON.stringify(body, null, 2));
      console.log("[QUIZZES_POST] Questions data specifically:", JSON.stringify(body.questions, null, 2));
    }

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
      for (let i = 0; i < validatedData.questions.length; i++) {
        const questionData = validatedData.questions[i];
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

    // Handle validation errors from Zod
    if (error instanceof z.ZodError) {
      console.error("[QUIZZES_POST] Validation Error:", error.issues);
      return NextResponse.json({
        error: "Validation failed",
        details: error.issues
      }, { status: 422 });
    }

    // Handle other types of errors
    console.error("[QUIZZES_POST] Error:", error);
    if (error instanceof Error) {
      console.error("[QUIZZES_POST] Error stack:", error.stack);
    }

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

// app/api/quizzes/[id]/route.ts

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
  id?: string; // Optional for existing options
  text: string;
  text_sl?: string;
  text_hr?: string;
  isCorrect: boolean; // Changed from 'correct' to match form data
}

interface QuestionInput {
  id?: string; // Optional for existing questions
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
  id: z.string().optional(), // Remove UUID validation - allow any string ID format
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
  id: z.string().optional(), // Remove UUID validation - allow any string ID format
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
  questions: z
    .array(questionSchema)
    .min(1, "At least 1 question is required"),
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
 * Creates a new question along with its options within a transaction.
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
  let answersData = undefined;
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

/**
 * Updates an existing question and its options within a transaction.
 * @param tx - The Prisma transaction client.
 * @param questionId - The ID of the question to update.
 * @param questionData - The updated data for the question and its options.
 * @returns The updated question with its options and the correct option.
 */
async function updateQuestion(
  tx: Prisma.TransactionClient,
  questionId: string,
  questionData: QuestionInput
) {
  // Prepare answersData for MULTIPLE_CHOICE questions
  let answersData = undefined;
  if (questionData.questionType === "MULTIPLE_CHOICE" && questionData.multipleChoiceData) {
    answersData = questionData.multipleChoiceData;
  }

  // Step 1: Update the question's text and type
  await tx.question.update({
    where: { id: questionId },
    data: {
      text: questionData.text,
      text_sl: questionData.text_sl,
      text_hr: questionData.text_hr,
      questionType: questionData.questionType,
      answersData: answersData,
    },
  });

  // Step 2: Process options
  // a. Identify existing options
  const existingOptions = await tx.option.findMany({
    where: { questionId: questionId },
  });

  const incomingOptionIds = questionData.options
    .filter((opt) => opt.id)
    .map((opt) => opt.id as string);

  // b. Delete options that are not present in the incoming data
  const optionsToDelete = existingOptions.filter(
    (opt) => !incomingOptionIds.includes(opt.id)
  );
  for (const opt of optionsToDelete) {
    await tx.option.delete({
      where: { id: opt.id },
    });
  }

  // c. Update existing options and create new ones
  const updatedOptions = await Promise.all(
    questionData.options.map(async (opt) => {
      if (opt.id) {
        // Update existing option
        return tx.option.update({
          where: { id: opt.id },
          data: {
            text: opt.text,
            text_sl: opt.text_sl,
            text_hr: opt.text_hr,
            correct: opt.isCorrect, // Map isCorrect to correct field
          },
        });
      } else {
        // Create new option
        return tx.option.create({
          data: {
            text: opt.text,
            text_sl: opt.text_sl,
            text_hr: opt.text_hr,
            correct: opt.isCorrect, // Map isCorrect to correct field
            questionId: questionId,
          },
        });
      }
    })
  );

  // Step 3: For SINGLE_CHOICE questions, identify and set the correct option
  if (questionData.questionType === "SINGLE_CHOICE") {
    const correctOption = updatedOptions.find((opt) => opt.correct);
    if (!correctOption) {
      throw new Error("No correct option specified for a single choice question.");
    }

    // Step 4: Update the question with the correctOptionId
    await tx.question.update({
      where: { id: questionId },
      data: { correctOptionId: correctOption.id },
    });
  } else {
    // For other question types, clear the correctOptionId
    await tx.question.update({
      where: { id: questionId },
      data: { correctOptionId: null },
    });
  }

  // Step 5: Retrieve and return the updated question with relations
  return await tx.question.findUnique({
    where: { id: questionId },
    include: {
      options: true,
      correctOption: true,
    },
  });
}

// ----------------------
// PATCH Handler
// ----------------------

/**
 * Updates an existing quiz identified by its ID.
 * Handles updating the quiz's basic information, questions, and options.
 * @param req - The incoming HTTP request.
 * @param params - The route parameters containing the quiz ID.
 * @returns A JSON response with the updated quiz data or an error message.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;

  // Validate quizId as a UUID
  const quizIdSchema = z.string().uuid();
  const parseQuizId = quizIdSchema.safeParse(quizId);
  if (!parseQuizId.success) {
    return new NextResponse("Invalid quiz ID format", { status: 400 });
  }

  try {
    // Step 1: Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
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

    // Debug logging to see what's being sent
    console.log("PATCH Quiz Data Debug:", JSON.stringify({
      questionsCount: body.questions?.length,
      questions: body.questions?.map((q, i) => ({
        index: i,
        questionType: q.questionType,
        optionsCount: q.options?.length,
        correctOptions: q.options?.filter(o => o.isCorrect)?.length,
        options: q.options?.map(o => ({ text: o.text, isCorrect: o.isCorrect }))
      }))
    }, null, 2));

    const validatedData = quizSchema.parse(body);

    // Step 4: Begin a transaction to update the quiz and its relations
    const updatedQuiz = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 4.1: Check if the quiz exists
      const existingQuiz = await tx.quiz.findUnique({
        where: { id: quizId },
      });

      if (!existingQuiz) {
        throw new Error("Quiz not found");
      }

      // 4.2: Update the quiz's basic fields
      await tx.quiz.update({
        where: { id: quizId },
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

      // 4.3: Fetch existing questions
      const existingQuestions = await tx.question.findMany({
        where: { quizId: quizId },
      });

      const incomingQuestionIds = validatedData.questions
        .filter((q) => q.id)
        .map((q) => q.id as string);

      // 4.4: Delete questions that are not present in the incoming data
      const questionsToDelete = existingQuestions.filter(
        (q) => !incomingQuestionIds.includes(q.id)
      );
      for (const q of questionsToDelete) {
        await tx.question.delete({
          where: { id: q.id },
        });
      }

      // 4.5: Update existing questions and create new ones
      for (const questionData of validatedData.questions) {
        if (questionData.id) {
          // Update existing question
          await updateQuestion(tx, questionData.id, questionData);
        } else {
          // Create new question
          await createQuestion(tx, quizId, questionData);
        }
      }

      // 4.6: Retrieve and return the updated quiz with all relations
      return tx.quiz.findUnique({
        where: { id: quizId },
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

    // Step 5: Respond with the updated quiz data
    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("[QUIZZES_PATCH]", error);

    // Handle validation errors from Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }

    // Handle not found error
    if (error instanceof Error && error.message === "Quiz not found") {
      return new NextResponse(error.message, { status: 404 });
    }

    // Handle other types of errors
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

// ----------------------
// DELETE Handler
// ----------------------

/**
 * Deletes an existing quiz identified by its ID.
 * Also deletes all associated questions and options.
 * @param req - The incoming HTTP request.
 * @param params - The route parameters containing the quiz ID.
 * @returns A JSON response confirming deletion or an error message.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;

  // Validate quizId as a UUID
  const quizIdSchema = z.string().uuid();
  const parseQuizId = quizIdSchema.safeParse(quizId);
  if (!parseQuizId.success) {
    return new NextResponse("Invalid quiz ID format", { status: 400 });
  }

  try {
    // Step 1: Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Step 2: Check if the user has admin or teacher access
    const isAuthorized = await checkAdminAccess(session.user.id);
    if (!isAuthorized) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Step 3: Begin a transaction to delete the quiz and its relations
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 3.1: Check if the quiz exists
      const existingQuiz = await tx.quiz.findUnique({
        where: { id: quizId },
      });

      if (!existingQuiz) {
        throw new Error("Quiz not found");
      }

      // 3.2: First, delete all quiz submissions for this quiz
      await tx.quizSubmission.deleteMany({
        where: { quizId: quizId },
      });

      // 3.3: Get all questions for this quiz
      const questions = await tx.question.findMany({
        where: { quizId: quizId },
        select: { id: true },
      });

      // 3.4: Clear correctOptionId from all questions to break circular references
      await tx.question.updateMany({
        where: { quizId: quizId },
        data: { correctOptionId: null },
      });

      // 3.5: Delete all options for these questions
      for (const question of questions) {
        await tx.option.deleteMany({
          where: { questionId: question.id },
        });
      }

      // 3.6: Delete all questions for this quiz
      await tx.question.deleteMany({
        where: { quizId: quizId },
      });

      // 3.7: Finally, delete the quiz
      await tx.quiz.delete({
        where: { id: quizId },
      });
    });

    // Step 4: Respond with a success message
    return new NextResponse("Quiz deleted successfully", { status: 200 });
  } catch (error) {
    console.error("[QUIZZES_DELETE]", error);

    // Handle not found error
    if (error instanceof Error && error.message === "Quiz not found") {
      return new NextResponse(error.message, { status: 404 });
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

/**
 * Retrieves a specific quiz identified by its ID.
 * Includes related data such as teacher, questions, options, and correct options.
 * @param req - The incoming HTTP request.
 * @param params - The route parameters containing the quiz ID.
 * @returns A JSON response with the quiz data or an error message.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;

  // Validate quizId as a UUID
  const quizIdSchema = z.string().uuid();
  const parseQuizId = quizIdSchema.safeParse(quizId);
  if (!parseQuizId.success) {
    return new NextResponse("Invalid quiz ID format", { status: 400 });
  }

  try {
    // Step 1: Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Step 2: Check if the user has admin or teacher access
    const isAuthorized = await checkAdminAccess(session.user.id);
    if (!isAuthorized) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Step 3: Retrieve the quiz with related data
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
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

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    // Step 4: Respond with the retrieved quiz data
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZZES_GET_BY_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

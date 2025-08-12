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
  correct: boolean;
}

interface QuestionInput {
  id?: string; // Optional for existing questions
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
  id: z.string().uuid().optional(),
  text: z.string().min(1, "Option text is required"),
  correct: z.boolean(),
});

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().min(1, "Question text is required"),
  options: z
    .array(optionSchema)
    .min(2, "At least 2 options are required")
    .refine(
      (options) => options.filter((opt) => opt.correct).length === 1,
      {
        message: "Exactly one option must be marked as correct",
      }
    ),
});

const quizSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z.string().optional(),
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
  // Step 1: Update the question's text
  await tx.question.update({
    where: { id: questionId },
    data: {
      text: questionData.text,
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
            correct: opt.correct,
          },
        });
      } else {
        // Create new option
        return tx.option.create({
          data: {
            text: opt.text,
            correct: opt.correct,
            questionId: questionId,
          },
        });
      }
    })
  );

  // Step 3: Identify the correct option
  const correctOption = updatedOptions.find((opt) => opt.correct);
  if (!correctOption) {
    throw new Error("No correct option specified for a question.");
  }

  // Step 4: Update the question with the correctOptionId
  await tx.question.update({
    where: { id: questionId },
    data: { correctOptionId: correctOption.id },
  });

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
          description: validatedData.description,
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

      // 3.2: Delete the quiz
      // Due to Cascade Delete, associated options and questions will be automatically deleted
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

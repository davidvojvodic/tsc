// app/api/quizzes/[id]/route.ts

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
  id?: string; // Optional for existing options
  text?: string | null;
  text_sl?: string;
  text_hr?: string;
  isCorrect: boolean; // Changed from 'correct' to match form data
}

interface QuestionInput {
  id?: string; // Optional for existing questions
  text?: string | null;
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
        text?: string | null;
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
  // Prepare answersData for different question types
  let answersData = undefined;
  if (questionData.questionType === "MULTIPLE_CHOICE" && questionData.multipleChoiceData) {
    answersData = questionData.multipleChoiceData;
  } else if (questionData.questionType === "TEXT_INPUT" && questionData.textInputData) {
    answersData = questionData.textInputData;
  } else if (questionData.questionType === "DROPDOWN" && questionData.dropdownData) {
    answersData = questionData.dropdownData;
  } else if (questionData.questionType === "ORDERING" && questionData.orderingData) {
    answersData = questionData.orderingData;
  } else if (questionData.questionType === "MATCHING" && questionData.matchingData) {
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
  const options = questionData.options ? await Promise.all(
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
  // Prepare answersData for different question types
  let answersData = undefined;
  if (questionData.questionType === "MULTIPLE_CHOICE" && questionData.multipleChoiceData) {
    answersData = questionData.multipleChoiceData;
  } else if (questionData.questionType === "TEXT_INPUT" && questionData.textInputData) {
    answersData = questionData.textInputData;
  } else if (questionData.questionType === "DROPDOWN" && questionData.dropdownData) {
    answersData = questionData.dropdownData;
  } else if (questionData.questionType === "ORDERING" && questionData.orderingData) {
    answersData = questionData.orderingData;
  } else if (questionData.questionType === "MATCHING" && questionData.matchingData) {
    answersData = questionData.matchingData;
  }

  // Step 1: Update the question's text and type
  await tx.question.update({
    where: { id: questionId },
    data: {
      text: questionData.text,
      text_sl: questionData.text_sl,
      text_hr: questionData.text_hr,
      imageUrl: questionData.imageUrl,
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
    ? questionData.options.filter((opt) => opt.id)
        .map((opt) => opt.id as string)
    : [];

  // b. Delete options that are not present in the incoming data
  const optionsToDelete = existingOptions.filter(
    (opt) => !incomingOptionIds.includes(opt.id)
  );
  for (const opt of optionsToDelete) {
    await tx.option.delete({
      where: { id: opt.id },
    });
  }

  // c. Update existing options and create new ones (if any)
  const updatedOptions = questionData.options ? await Promise.all(
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
  ) : [];

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
    if (process.env.NODE_ENV === 'development') {
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
    }

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
          orderBy: {
            createdAt: 'asc'
          }
        },
      },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    // Step 4: Transform database data to frontend format
    if (process.env.NODE_ENV === 'development') {
      console.log("[QUIZZES_GET] Raw quiz data from database:", JSON.stringify(quiz, null, 2));
      console.log("[QUIZZES_GET] Questions answersData:", quiz.questions.map(q => ({
        id: q.id,
        questionType: q.questionType,
        answersData: q.answersData
      })));
    }

    const transformedQuiz = {
      ...quiz,
      questions: quiz.questions.map(question => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[QUIZZES_GET] Transforming question ${question.id} (${question.questionType}):`, {
            hasAnswersData: !!question.answersData,
            answersData: question.answersData
          });
        }

        return {
        id: question.id,
        text: question.text,
        text_sl: question.text_sl,
        text_hr: question.text_hr,
        imageUrl: question.imageUrl,
        questionType: question.questionType,
        options: question.options.map(option => ({
          id: option.id,
          text: option.text,
          text_sl: option.text_sl,
          text_hr: option.text_hr,
          isCorrect: option.correct, // Map 'correct' to 'isCorrect'
        })),
        // Transform answersData back to appropriate typed data based on questionType
        ...(question.questionType === "MULTIPLE_CHOICE" && question.answersData && {
          multipleChoiceData: question.answersData
        }),
        ...(question.questionType === "TEXT_INPUT" && question.answersData && {
          textInputData: question.answersData
        }),
        ...(question.questionType === "DROPDOWN" && question.answersData && {
          dropdownData: question.answersData
        }),
        ...(question.questionType === "ORDERING" && question.answersData && {
          orderingData: question.answersData
        }),
        ...(question.questionType === "MATCHING" && question.answersData && {
          matchingData: question.answersData
        }),
        };
      })
    };

    if (process.env.NODE_ENV === 'development') {
      console.log("[QUIZZES_GET] Transformed quiz data:", JSON.stringify(transformedQuiz, null, 2));
    }

    // Step 5: Respond with the transformed quiz data
    return NextResponse.json(transformedQuiz);
  } catch (error) {
    console.error("[QUIZZES_GET_BY_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

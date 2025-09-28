// lib/schemas/quiz.ts
import * as z from "zod";

// Base option schema for multilingual support
const optionSchema = z.object({
  id: z.string().optional(), // For existing options during updates
  text: z.string(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  isCorrect: z.boolean().default(false),
}).refine((data) => {
  // At least one of the text fields must have content
  const hasText = (data.text && data.text.trim().length > 0) ||
                 (data.text_sl && data.text_sl.trim().length > 0) ||
                 (data.text_hr && data.text_hr.trim().length > 0);
  return hasText;
}, {
  message: "Option must have text in at least one language",
});

// Partial credit rules for multiple choice scoring
const partialCreditRulesSchema = z.object({
  correctSelectionPoints: z.number().min(0).default(1),
  incorrectSelectionPenalty: z.number().max(0).default(0),
  minScore: z.number().min(0).default(0),
});

// Multiple choice specific data schema
const multipleChoiceDataSchema = z.object({
  scoringMethod: z.enum(["ALL_OR_NOTHING", "PARTIAL_CREDIT"]).default("ALL_OR_NOTHING"),
  minSelections: z.number().min(1).default(1),
  maxSelections: z.number().min(1).optional(),
  partialCreditRules: partialCreditRulesSchema.optional(),
});

// Text input specific data schema - simplified to text only
const textInputDataSchema = z.object({
  acceptableAnswers: z.array(z.string().min(1)).min(1, "At least one acceptable answer is required"),
  caseSensitive: z.boolean().default(false),
  placeholder: z.string().optional(),
  placeholder_sl: z.string().optional(),
  placeholder_hr: z.string().optional(),
});

// Question schema with support for both single and multiple choice
const questionSchema = z.object({
  id: z.string().optional(), // For existing questions during updates
  text: z.string(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  questionType: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT_INPUT"]).default("SINGLE_CHOICE"),
  options: z.array(optionSchema).optional(),
  multipleChoiceData: multipleChoiceDataSchema.optional(),
  textInputData: textInputDataSchema.optional(),
}).refine((data) => {
  // Question must have text in at least one language
  const hasQuestionText = (data.text && data.text.trim().length > 0) ||
                         (data.text_sl && data.text_sl.trim().length > 0) ||
                         (data.text_hr && data.text_hr.trim().length > 0);
  if (!hasQuestionText) {
    return false;
  }

  // Validation for single choice questions
  if (data.questionType === "SINGLE_CHOICE") {
    if (!data.options || data.options.length < 2) {
      return false;
    }
    const correctOptions = data.options.filter(opt => opt.isCorrect);
    return correctOptions.length === 1;
  }

  // Validation for multiple choice questions
  if (data.questionType === "MULTIPLE_CHOICE") {
    if (!data.options || data.options.length < 2) {
      return false;
    }
    const correctOptions = data.options.filter(opt => opt.isCorrect);

    // At least one option must be correct
    if (correctOptions.length === 0) {
      return false;
    }

    // If maxSelections is specified, it cannot exceed the number of options
    if (data.multipleChoiceData?.maxSelections &&
        data.multipleChoiceData.maxSelections > data.options.length) {
      return false;
    }

    // minSelections must be at least 1
    if (data.multipleChoiceData?.minSelections &&
        data.multipleChoiceData.minSelections < 1) {
      return false;
    }

    return true;
  }

  // Validation for text input questions
  if (data.questionType === "TEXT_INPUT") {
    // Text input questions don't need options
    if (!data.textInputData) {
      return false;
    }

    // Must have at least one acceptable answer
    if (!data.textInputData.acceptableAnswers ||
        data.textInputData.acceptableAnswers.length === 0) {
      return false;
    }

    return true;
  }

  return true;
}, {
  message: "Invalid question configuration",
});

export const quizSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  title_sl: z.string().optional(),
  title_hr: z.string().optional(),
  description: z.string().optional(),
  description_sl: z.string().optional(),
  description_hr: z.string().optional(),
  teacherId: z.string().min(1, "Please select a teacher"),
  questions: z.array(questionSchema).min(1, "At least 1 question is required"),
});

// Schema for quiz submissions - supports single choice, multiple choice, and text input answers
export const quizSubmissionSchema = z.object({
  answers: z.record(
    z.string(), // questionId
    z.union([
      z.string(), // Single choice: optionId OR Text input: answer text
      z.array(z.string()) // Multiple choice: array of optionIds
    ])
  ),
});

// Export types
export type QuizSchemaType = z.infer<typeof quizSchema>;
export type QuestionSchemaType = z.infer<typeof questionSchema>;
export type OptionSchemaType = z.infer<typeof optionSchema>;
export type MultipleChoiceDataType = z.infer<typeof multipleChoiceDataSchema>;
export type TextInputDataType = z.infer<typeof textInputDataSchema>;
export type PartialCreditRulesType = z.infer<typeof partialCreditRulesSchema>;
export type QuizSubmissionType = z.infer<typeof quizSubmissionSchema>;
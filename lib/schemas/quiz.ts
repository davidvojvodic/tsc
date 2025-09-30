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

// Dropdown option schema for dropdown questions
const dropdownOptionSchema = z.object({
  id: z.string().min(1, "Option ID required"),
  text: z.string().min(1, "Option text required"),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  isCorrect: z.boolean(),
});

// Individual dropdown field schema
const dropdownFieldSchema = z.object({
  id: z.string().min(1, "Dropdown ID required"),
  label: z.string().min(1, "Label required"),
  label_sl: z.string().optional(),
  label_hr: z.string().optional(),
  options: z.array(dropdownOptionSchema).min(2, "At least 2 options required"),
});

// Dropdown scoring configuration
const dropdownScoringSchema = z.object({
  pointsPerDropdown: z.number().positive().default(1),
  requireAllCorrect: z.boolean().default(true),
  penalizeIncorrect: z.boolean().default(false),
});

// Dropdown specific data schema
const dropdownDataSchema = z.object({
  template: z.string().min(1, "Template text required"),
  template_sl: z.string().optional(),
  template_hr: z.string().optional(),
  dropdowns: z.array(dropdownFieldSchema).min(1, "At least 1 dropdown required").max(10, "Maximum 10 dropdowns allowed"),
  scoring: dropdownScoringSchema.optional(),
});

// Ordering content schemas
const orderingTextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1, "Text content required"),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
});

const orderingImageContentSchema = z.object({
  type: z.literal("image"),
  imageUrl: z.string().url("Valid image URL required"),
  altText: z.string().min(1, "Alt text required"),
  altText_sl: z.string().optional(),
  altText_hr: z.string().optional(),
});

const orderingMixedContentSchema = z.object({
  type: z.literal("mixed"),
  text: z.string().optional(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  imageUrl: z.string().url().optional(),
  suffix: z.string().optional(),
  suffix_sl: z.string().optional(),
  suffix_hr: z.string().optional(),
});

// Ordering item schema
const orderingItemSchema = z.object({
  id: z.string().min(1, "Item ID required"),
  content: z.discriminatedUnion("type", [
    orderingTextContentSchema,
    orderingImageContentSchema,
    orderingMixedContentSchema,
  ]),
  correctPosition: z.number().int().positive(),
});

// Ordering specific data schema
const orderingDataSchema = z.object({
  instructions: z.string().min(1, "Instructions required"),
  instructions_sl: z.string().optional(),
  instructions_hr: z.string().optional(),
  items: z.array(orderingItemSchema).min(2, "At least 2 items required").max(10, "Maximum 10 items allowed"),
  allowPartialCredit: z.boolean().default(false),
  exactOrderRequired: z.boolean().default(true),
});

// Question schema with support for both single and multiple choice
const questionSchema = z.object({
  id: z.string().optional(), // For existing questions during updates
  text: z.string(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  questionType: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT_INPUT", "DROPDOWN", "ORDERING"]).default("SINGLE_CHOICE"),
  options: z.array(optionSchema).optional(),
  multipleChoiceData: multipleChoiceDataSchema.optional(),
  textInputData: textInputDataSchema.optional(),
  dropdownData: dropdownDataSchema.optional(),
  orderingData: orderingDataSchema.optional(),
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

  // Validation for dropdown questions
  if (data.questionType === "DROPDOWN") {
    if (!data.dropdownData) {
      return false;
    }

    // Each dropdown must have at least one correct option
    for (const dropdown of data.dropdownData.dropdowns) {
      const correctOptions = dropdown.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        return false;
      }
    }

    // Validate template contains all dropdown placeholders
    const { template, dropdowns } = data.dropdownData;

    for (const dropdown of dropdowns) {
      const placeholder = `{${dropdown.id}}`;
      if (!template.includes(placeholder)) {
        return false;
      }
    }

    // Check for orphaned placeholders
    const placeholderRegex = /\{([^}]+)\}/g;
    const templatePlaceholders = [...template.matchAll(placeholderRegex)].map(match => match[1]);
    const dropdownIds = dropdowns.map(d => d.id);

    const orphanedPlaceholders = templatePlaceholders.filter(p => !dropdownIds.includes(p));
    if (orphanedPlaceholders.length > 0) {
      return false;
    }

    return true;
  }

  // Validation for ordering questions
  if (data.questionType === "ORDERING") {
    if (!data.orderingData) {
      return false;
    }

    // Must have at least 2 items
    if (!data.orderingData.items || data.orderingData.items.length < 2) {
      return false;
    }

    // Validate position numbers are sequential starting from 1
    const positions = data.orderingData.items
      .map(item => item.correctPosition)
      .sort((a, b) => a - b);

    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        return false;
      }
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

// Schema for quiz submissions - supports single choice, multiple choice, text input, and dropdown answers
export const quizSubmissionSchema = z.object({
  answers: z.record(
    z.string(), // questionId
    z.union([
      z.string(), // Single choice: optionId OR Text input: answer text
      z.array(z.string()), // Multiple choice: array of optionIds
      z.record(z.string(), z.string()) // Dropdown: dropdownId -> selectedOptionId
    ])
  ),
});

// Export types
export type QuizSchemaType = z.infer<typeof quizSchema>;
export type QuestionSchemaType = z.infer<typeof questionSchema>;
export type OptionSchemaType = z.infer<typeof optionSchema>;
export type MultipleChoiceDataType = z.infer<typeof multipleChoiceDataSchema>;
export type TextInputDataType = z.infer<typeof textInputDataSchema>;
export type DropdownDataType = z.infer<typeof dropdownDataSchema>;
export type DropdownFieldType = z.infer<typeof dropdownFieldSchema>;
export type DropdownOptionType = z.infer<typeof dropdownOptionSchema>;
export type DropdownScoringType = z.infer<typeof dropdownScoringSchema>;
export type PartialCreditRulesType = z.infer<typeof partialCreditRulesSchema>;
export type OrderingDataType = z.infer<typeof orderingDataSchema>;
export type OrderingItemType = z.infer<typeof orderingItemSchema>;
export type QuizSubmissionType = z.infer<typeof quizSubmissionSchema>;
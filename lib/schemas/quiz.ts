// lib/schemas/quiz.ts
import * as z from "zod";

// Base option schema for multilingual support
const optionSchema = z.object({
  id: z.string().optional(), // For existing options during updates
  text: z.string().optional(),
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
  text: z.string().optional(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  isCorrect: z.boolean(),
}).refine((data) => {
  // At least one of the text fields must have content
  const hasText = (data.text && data.text.trim().length > 0) ||
                 (data.text_sl && data.text_sl.trim().length > 0) ||
                 (data.text_hr && data.text_hr.trim().length > 0);
  return hasText;
}, {
  message: "Dropdown option must have text in at least one language",
});

// Individual dropdown field schema
const dropdownFieldSchema = z.object({
  id: z.string().min(1, "Dropdown ID required"),
  label: z.string().optional(),
  label_sl: z.string().optional(),
  label_hr: z.string().optional(),
  options: z.array(dropdownOptionSchema).min(2, "At least 2 options required"),
}).refine((data) => {
  // At least one of the label fields must have content
  const hasLabel = (data.label && data.label.trim().length > 0) ||
                   (data.label_sl && data.label_sl.trim().length > 0) ||
                   (data.label_hr && data.label_hr.trim().length > 0);
  return hasLabel;
}, {
  message: "Dropdown field must have a label in at least one language",
});

// Dropdown scoring configuration
const dropdownScoringSchema = z.object({
  pointsPerDropdown: z.number().positive().default(1),
  requireAllCorrect: z.boolean().default(true),
  penalizeIncorrect: z.boolean().default(false),
});

// Dropdown specific data schema
const dropdownDataSchema = z.object({
  template: z.string().optional(),
  template_sl: z.string().optional(),
  template_hr: z.string().optional(),
  dropdowns: z.array(dropdownFieldSchema).min(1, "At least 1 dropdown required").max(10, "Maximum 10 dropdowns allowed"),
  scoring: dropdownScoringSchema.optional(),
}).refine((data) => {
  // At least one of the template fields must have content
  const hasTemplate = (data.template && data.template.trim().length > 0) ||
                      (data.template_sl && data.template_sl.trim().length > 0) ||
                      (data.template_hr && data.template_hr.trim().length > 0);
  return hasTemplate;
}, {
  message: "Dropdown question must have a template in at least one language",
});

// Ordering content schemas - simplified to text only
const orderingTextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string().optional(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
});

// Ordering item schema - text only
const orderingItemSchema = z.object({
  id: z.string().min(1, "Item ID required"),
  content: orderingTextContentSchema,
  correctPosition: z.number().int().positive(),
}).refine((data) => {
  if (data.content.type === "text") {
    const hasText = (data.content.text && data.content.text.trim().length > 0) ||
                   (data.content.text_sl && data.content.text_sl.trim().length > 0) ||
                   (data.content.text_hr && data.content.text_hr.trim().length > 0);
    return hasText;
  }
  return true;
}, {
  message: "Ordering item must have text in at least one language",
});

// Ordering specific data schema
const orderingDataSchema = z.object({
  instructions: z.string().optional(),
  instructions_sl: z.string().optional(),
  instructions_hr: z.string().optional(),
  items: z.array(orderingItemSchema).min(2, "At least 2 items required").max(10, "Maximum 10 items allowed"),
  allowPartialCredit: z.boolean().default(false),
  exactOrderRequired: z.boolean().default(true),
}).refine((data) => {
  // At least one of the instructions fields must have content
  const hasInstructions = (data.instructions && data.instructions.trim().length > 0) ||
                          (data.instructions_sl && data.instructions_sl.trim().length > 0) ||
                          (data.instructions_hr && data.instructions_hr.trim().length > 0);
  return hasInstructions;
}, {
  message: "Ordering question must have instructions in at least one language",
});

// Matching content schemas - supports text, image, and mixed
const matchingTextContentSchema = z.object({
  type: z.literal("text"),
  text: z.string().optional(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
});

const matchingImageContentSchema = z.object({
  type: z.literal("image"),
  imageUrl: z.string().url().min(1, "Image URL required"),
  altText: z.string().optional(),
  altText_sl: z.string().optional(),
  altText_hr: z.string().optional(),
});

const matchingMixedContentSchema = z.object({
  type: z.literal("mixed"),
  text: z.string().optional(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  imageUrl: z.string().url().optional(),
  suffix: z.string().optional(),
  suffix_sl: z.string().optional(),
  suffix_hr: z.string().optional(),
});

const matchingItemContentSchema = z.discriminatedUnion("type", [
  matchingTextContentSchema,
  matchingImageContentSchema,
  matchingMixedContentSchema,
]);

// Matching item schema - supports text, image, and mixed content
const matchingItemSchema = z.object({
  id: z.string().min(1, "Item ID required"),
  position: z.number().int().positive(),
  content: matchingItemContentSchema,
}).refine((data) => {
  if (data.content.type === "text") {
    const hasText = (data.content.text && data.content.text.trim().length > 0) ||
                   (data.content.text_sl && data.content.text_sl.trim().length > 0) ||
                   (data.content.text_hr && data.content.text_hr.trim().length > 0);
    return hasText;
  }
  return true;
}, {
  message: "Matching item must have text in at least one language",
});

// Correct match schema
const correctMatchSchema = z.object({
  leftId: z.string().min(1, "Left item ID required"),
  rightId: z.string().min(1, "Right item ID required"),
  explanation: z.string().optional(),
  explanation_sl: z.string().optional(),
  explanation_hr: z.string().optional(),
});

// Matching scoring schema
const matchingScoringSchema = z.object({
  pointsPerMatch: z.number().positive().default(1),
  penalizeIncorrect: z.boolean().default(true),
  penaltyPerIncorrect: z.number().min(0).max(2).default(0.5),
  requireAllMatches: z.boolean().default(false),
  partialCredit: z.boolean().default(true),
});

// Matching display schema (optional, most can use defaults)
const matchingDisplaySchema = z.object({
  connectionStyle: z.enum(["line", "arrow", "dashed"]).default("line"),
  connectionColor: z.string().default("#3b82f6"),
  correctColor: z.string().default("#10b981"),
  incorrectColor: z.string().default("#ef4444"),
  showConnectionLabels: z.boolean().default(false),
  animateConnections: z.boolean().default(true),
});

// Matching specific data schema
const matchingDataSchema = z.object({
  instructions: z.string().optional(),
  instructions_sl: z.string().optional(),
  instructions_hr: z.string().optional(),
  matchingType: z.literal("one-to-one").default("one-to-one"),
  leftItems: z.array(matchingItemSchema).min(2, "At least 2 left items required").max(8, "Maximum 8 left items allowed"),
  rightItems: z.array(matchingItemSchema).min(2, "At least 2 right items required").max(10, "Maximum 10 right items allowed"),
  correctMatches: z.array(correctMatchSchema).min(1, "At least 1 correct match required"),
  distractors: z.array(z.string()).optional(),
  scoring: matchingScoringSchema.optional(),
  display: matchingDisplaySchema.optional(),
}).refine((data) => {
  const hasInstructions = (data.instructions && data.instructions.trim().length > 0) ||
                          (data.instructions_sl && data.instructions_sl.trim().length > 0) ||
                          (data.instructions_hr && data.instructions_hr.trim().length > 0);
  return hasInstructions;
}, {
  message: "Matching question must have instructions in at least one language",
});

// Question schema with support for both single and multiple choice
const questionSchema = z.object({
  id: z.string().optional(), // For existing questions during updates
  text: z.string().optional(),
  text_sl: z.string().optional(),
  text_hr: z.string().optional(),
  imageUrl: z.string().url().optional(),
  questionType: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT_INPUT", "DROPDOWN", "ORDERING", "MATCHING"]).default("SINGLE_CHOICE"),
  options: z.array(optionSchema).optional(),
  multipleChoiceData: multipleChoiceDataSchema.optional(),
  textInputData: textInputDataSchema.optional(),
  dropdownData: dropdownDataSchema.optional(),
  orderingData: orderingDataSchema.optional(),
  matchingData: matchingDataSchema.optional(),
}).refine((data) => {
  // For TEXT_INPUT questions: must have text OR imageUrl
  if (data.questionType === "TEXT_INPUT") {
    const hasQuestionText = (data.text && data.text.trim().length > 0) ||
                           (data.text_sl && data.text_sl.trim().length > 0) ||
                           (data.text_hr && data.text_hr.trim().length > 0);
    const hasImageUrl = data.imageUrl && data.imageUrl.trim().length > 0;

    if (!hasQuestionText && !hasImageUrl) {
      return false;
    }
  } else {
    // For all other question types: text is required
    const hasQuestionText = (data.text && data.text.trim().length > 0) ||
                           (data.text_sl && data.text_sl.trim().length > 0) ||
                           (data.text_hr && data.text_hr.trim().length > 0);
    if (!hasQuestionText) {
      return false;
    }
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

    if (template) {
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

  // Validation for matching questions
  if (data.questionType === "MATCHING") {
    if (!data.matchingData) {
      return false;
    }

    const { leftItems, rightItems, correctMatches, matchingType, distractors } = data.matchingData;

    // Must have at least 2 items in each column
    if (leftItems.length < 2 || rightItems.length < 2) {
      return false;
    }

    // All correct matches must reference existing items
    const leftIds = leftItems.map(item => item.id);
    const rightIds = rightItems.map(item => item.id);

    for (const match of correctMatches) {
      if (!leftIds.includes(match.leftId) || !rightIds.includes(match.rightId)) {
        return false;
      }
    }

    // Validate one-to-one matching: no duplicates allowed
    const leftMatches = correctMatches.map(m => m.leftId);
    const rightMatches = correctMatches.map(m => m.rightId);
    const uniqueLeft = new Set(leftMatches);
    const uniqueRight = new Set(rightMatches);

    if (uniqueLeft.size !== leftMatches.length || uniqueRight.size !== rightMatches.length) {
      return false;
    }

    // Validate distractors are valid right item IDs
    if (distractors && distractors.length > 0) {
      for (const distractorId of distractors) {
        if (!rightIds.includes(distractorId)) {
          return false;
        }
      }
    }

    // Validate position numbers are sequential for both columns
    const leftPositions = leftItems.map(item => item.position).sort((a, b) => a - b);
    const rightPositions = rightItems.map(item => item.position).sort((a, b) => a - b);

    for (let i = 0; i < leftPositions.length; i++) {
      if (leftPositions[i] !== i + 1) {
        return false;
      }
    }

    for (let i = 0; i < rightPositions.length; i++) {
      if (rightPositions[i] !== i + 1) {
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
  title: z.string().min(2, "Title must be at least 2 characters long").optional(),
  title_sl: z.string().min(2, "Title must be at least 2 characters long").optional(),
  title_hr: z.string().min(2, "Title must be at least 2 characters long").optional(),
  description: z.string().optional(),
  description_sl: z.string().optional(),
  description_hr: z.string().optional(),
  teacherId: z.string().min(1, "Please select a teacher"),
  questions: z.array(questionSchema).min(1, "At least 1 question is required"),
}).refine((data) => {
  // At least one title in any language is required
  const hasTitle = (data.title && data.title.trim().length >= 2) ||
                   (data.title_sl && data.title_sl.trim().length >= 2) ||
                   (data.title_hr && data.title_hr.trim().length >= 2);
  return hasTitle;
}, {
  message: "Quiz title is required in at least one language",
});

// Schema for quiz submissions - supports all question types
export const quizSubmissionSchema = z.object({
  answers: z.record(
    z.string(), // questionId
    z.union([
      z.string(), // Single choice: optionId OR Text input: answer text
      z.array(z.string()), // Multiple choice: array of optionIds OR Ordering: array of itemIds
      z.record(z.string(), z.string()), // Dropdown: dropdownId -> selectedOptionId
      z.array(z.object({ // Matching: array of connections
        leftId: z.string(),
        rightId: z.string()
      }))
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
export type MatchingDataType = z.infer<typeof matchingDataSchema>;
export type MatchingItemType = z.infer<typeof matchingItemSchema>;
export type CorrectMatchType = z.infer<typeof correctMatchSchema>;
export type QuizSubmissionType = z.infer<typeof quizSubmissionSchema>;
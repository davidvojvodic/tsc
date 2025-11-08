// lib/validation-utils.ts
import { ZodError } from "zod";

/**
 * Represents a single validation error with its path and message
 */
export interface ValidationError {
  path: (string | number)[];
  message: string;
  code: string;
}

/**
 * Grouped validation errors separated by quiz-level and question-level errors
 */
export interface GroupedValidationErrors {
  quizErrors: ValidationError[];  // Errors for quiz title, teacherId, etc.
  questionErrors: Map<number, ValidationError[]>;  // Errors grouped by question index (0-based)
  hasErrors: boolean;
  totalErrorCount: number;
}

/**
 * Parse Zod validation errors and group them by question index
 *
 * @param zodError - The ZodError object from safeParse
 * @returns Grouped validation errors
 */
export function parseValidationErrors(zodError: ZodError): GroupedValidationErrors {
  const quizErrors: ValidationError[] = [];
  const questionErrors = new Map<number, ValidationError[]>();

  for (const issue of zodError.issues) {
    const error: ValidationError = {
      path: issue.path,
      message: issue.message,
      code: issue.code,
    };

    // Check if this is a question-level error
    if (issue.path.length > 0 && issue.path[0] === "questions" && typeof issue.path[1] === "number") {
      const questionIndex = issue.path[1];

      if (!questionErrors.has(questionIndex)) {
        questionErrors.set(questionIndex, []);
      }

      questionErrors.get(questionIndex)!.push(error);
    } else {
      // This is a quiz-level error
      quizErrors.push(error);
    }
  }

  const totalErrorCount = quizErrors.length + Array.from(questionErrors.values()).reduce((sum, errors) => sum + errors.length, 0);

  return {
    quizErrors,
    questionErrors,
    hasErrors: totalErrorCount > 0,
    totalErrorCount,
  };
}

/**
 * Format a validation error path into a human-readable string
 *
 * @param path - The error path array from Zod
 * @returns Formatted path string
 *
 * @example
 * formatErrorPath(["questions", 0, "text"]) => "Question 1 - Text"
 * formatErrorPath(["questions", 2, "options", 1, "content", "imageUrl"]) => "Question 3 - Option 2 - Image URL"
 */
export function formatErrorPath(path: (string | number)[]): string {
  if (path.length === 0) {
    return "General";
  }

  const parts: string[] = [];

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];

    if (segment === "questions" && typeof path[i + 1] === "number") {
      // Question index (convert to 1-based)
      parts.push(`Question ${(path[i + 1] as number) + 1}`);
      i++; // Skip the index number in next iteration
    } else if (segment === "options" && typeof path[i + 1] === "number") {
      // Option index (convert to 1-based)
      parts.push(`Option ${(path[i + 1] as number) + 1}`);
      i++; // Skip the index number in next iteration
    } else if (segment === "dropdownData") {
      parts.push("Dropdown Configuration");
    } else if (segment === "dropdowns" && typeof path[i + 1] === "number") {
      parts.push(`Dropdown ${(path[i + 1] as number) + 1}`);
      i++; // Skip the index number
    } else if (segment === "orderingData") {
      parts.push("Ordering Configuration");
    } else if (segment === "items" && typeof path[i + 1] === "number") {
      parts.push(`Item ${(path[i + 1] as number) + 1}`);
      i++; // Skip the index number
    } else if (segment === "matchingData") {
      parts.push("Matching Configuration");
    } else if (segment === "leftItems" && typeof path[i + 1] === "number") {
      parts.push(`Left Item ${(path[i + 1] as number) + 1}`);
      i++; // Skip the index number
    } else if (segment === "rightItems" && typeof path[i + 1] === "number") {
      parts.push(`Right Item ${(path[i + 1] as number) + 1}`);
      i++; // Skip the index number
    } else if (segment === "content") {
      parts.push("Content");
    } else if (segment === "imageUrl") {
      parts.push("Image URL");
    } else if (segment === "text") {
      parts.push("Text");
    } else if (segment === "template") {
      parts.push("Template");
    } else if (segment === "label") {
      parts.push("Label");
    } else if (segment === "isCorrect") {
      parts.push("Correct Answer");
    } else if (typeof segment === "string") {
      // Capitalize first letter for other string segments
      parts.push(segment.charAt(0).toUpperCase() + segment.slice(1));
    }
  }

  return parts.join(" - ");
}

/**
 * Get a short summary message for validation errors
 *
 * @param errors - Grouped validation errors
 * @returns Summary message
 */
export function getValidationSummary(errors: GroupedValidationErrors): string {
  if (!errors.hasErrors) {
    return "No validation errors";
  }

  const parts: string[] = [];

  if (errors.quizErrors.length > 0) {
    parts.push(`${errors.quizErrors.length} quiz error${errors.quizErrors.length > 1 ? "s" : ""}`);
  }

  if (errors.questionErrors.size > 0) {
    const questionCount = errors.questionErrors.size;
    parts.push(`${questionCount} question${questionCount > 1 ? "s" : ""} with errors`);
  }

  return parts.join(", ");
}

/**
 * Check if a specific question has validation errors
 *
 * @param errors - Grouped validation errors
 * @param questionIndex - The question index (0-based)
 * @returns True if the question has errors
 */
export function questionHasErrors(errors: GroupedValidationErrors | null, questionIndex: number): boolean {
  if (!errors) return false;
  return errors.questionErrors.has(questionIndex);
}

/**
 * Get validation errors for a specific question
 *
 * @param errors - Grouped validation errors
 * @param questionIndex - The question index (0-based)
 * @returns Array of validation errors for the question, or empty array
 */
export function getQuestionErrors(errors: GroupedValidationErrors | null, questionIndex: number): ValidationError[] {
  if (!errors) return [];
  return errors.questionErrors.get(questionIndex) || [];
}

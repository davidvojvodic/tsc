import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import prisma from "./prisma";
import { QuestionType } from "@prisma/client";
import { MultipleChoiceDataType } from "./schemas/quiz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Get localized content from an object with multilingual fields
 */
export function getLocalizedContent<T extends Record<string, unknown>>(
  content: T,
  field: string,
  locale: string = "en"
): string {
  const localizedField = `${field}_${locale}`;
  return (content[localizedField] as string) || (content[field] as string) || "";
}

/**
 * Helper to create default multiple choice configuration
 */
export function createDefaultMultipleChoiceData(): MultipleChoiceDataType {
  return {
    scoringMethod: "ALL_OR_NOTHING",
    minSelections: 1,
    maxSelections: undefined,
    partialCreditRules: undefined,
  };
}

/**
 * Check if a question is multiple choice
 */
export function isMultipleChoice(questionType: QuestionType): boolean {
  return questionType === "MULTIPLE_CHOICE";
}

/**
 * Check if a question is single choice
 */
export function isSingleChoice(questionType: QuestionType): boolean {
  return questionType === "SINGLE_CHOICE";
}

/**
 * Get the appropriate answer structure for a question type
 */
export function getAnswerStructure(questionType: QuestionType): "string" | "array" {
  return questionType === "MULTIPLE_CHOICE" ? "array" : "string";
}

/**
 * Validate answer format for a question type
 */
export function validateAnswerFormat(
  questionType: QuestionType,
  answer: unknown
): { isValid: boolean; error?: string } {
  if (questionType === "SINGLE_CHOICE") {
    if (typeof answer !== "string") {
      return { isValid: false, error: "Single choice answers must be strings" };
    }
  } else if (questionType === "MULTIPLE_CHOICE") {
    if (!Array.isArray(answer)) {
      return { isValid: false, error: "Multiple choice answers must be arrays" };
    }
    if (!answer.every(item => typeof item === "string")) {
      return { isValid: false, error: "Multiple choice answers must be arrays of strings" };
    }
  }

  return { isValid: true };
}

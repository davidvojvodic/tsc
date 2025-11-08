/**
 * Transformers for converting between database models and application models
 * Handles backward compatibility between legacy text fields and new content system
 */

import type { Option as PrismaOption } from "@prisma/client";
import type { Option, OptionContent } from "@/components/quiz-editor/quiz-editor-layout";

/**
 * Transforms a Prisma Option model to an application Option model
 * Handles both legacy (text fields only) and new (content + text fields) formats
 */
export function prismaOptionToApp(prismaOption: PrismaOption): Option {
  // Check if this option uses the new content system
  const hasImageData =
    prismaOption.imageUrl ||
    prismaOption.contentType === "image" ||
    prismaOption.contentType === "mixed";

  if (hasImageData || prismaOption.contentType) {
    // New content system
    const contentType = prismaOption.contentType || "text";

    let content: OptionContent;

    switch (contentType) {
      case "text":
        content = {
          type: "text",
          text: prismaOption.text || undefined,
          text_sl: prismaOption.text_sl || undefined,
          text_hr: prismaOption.text_hr || undefined,
        };
        break;

      case "image":
        // Convert old image-only records to mixed content with empty text for backward compat
        content = {
          type: "mixed",
          text: "",
          text_sl: "",
          text_hr: "",
          imageUrl: prismaOption.imageUrl || undefined,
        };
        break;

      case "mixed":
        content = {
          type: "mixed",
          text: prismaOption.text || undefined,
          text_sl: prismaOption.text_sl || undefined,
          text_hr: prismaOption.text_hr || undefined,
          imageUrl: prismaOption.imageUrl || undefined,
        };
        break;

      default:
        // Fallback to text content
        content = {
          type: "text",
          text: prismaOption.text || undefined,
          text_sl: prismaOption.text_sl || undefined,
          text_hr: prismaOption.text_hr || undefined,
        };
    }

    return {
      id: prismaOption.id,
      text: prismaOption.text,
      text_sl: prismaOption.text_sl,
      text_hr: prismaOption.text_hr,
      content,
      isCorrect: prismaOption.correct,
    };
  }

  // Legacy format (text only)
  return {
    id: prismaOption.id,
    text: prismaOption.text,
    text_sl: prismaOption.text_sl,
    text_hr: prismaOption.text_hr,
    isCorrect: prismaOption.correct,
  };
}

/**
 * Transforms an application Option model to Prisma create/update input
 * Handles both legacy and new content formats
 */
export function appOptionToPrismaInput(
  option: Option
): {
  id?: string;
  text: string | null;
  text_sl: string | null;
  text_hr: string | null;
  imageUrl: string | null;
  altText: string | null;
  altText_sl: string | null;
  altText_hr: string | null;
  contentType: string;
  imageSuffix: string | null;
  imageSuffix_sl: string | null;
  imageSuffix_hr: string | null;
  correct: boolean;
} {
  // If option has new content system, use it
  if (option.content) {
    const content = option.content;

    switch (content.type) {
      case "text":
        return {
          id: option.id,
          text: content.text || null,
          text_sl: content.text_sl || null,
          text_hr: content.text_hr || null,
          imageUrl: null,
          altText: null,
          altText_sl: null,
          altText_hr: null,
          contentType: "text",
          imageSuffix: null,
          imageSuffix_sl: null,
          imageSuffix_hr: null,
          correct: option.isCorrect,
        };

      case "mixed":
        return {
          id: option.id,
          text: content.text || null,
          text_sl: content.text_sl || null,
          text_hr: content.text_hr || null,
          imageUrl: content.imageUrl || null,
          altText: null,
          altText_sl: null,
          altText_hr: null,
          contentType: "mixed",
          imageSuffix: null,
          imageSuffix_sl: null,
          imageSuffix_hr: null,
          correct: option.isCorrect,
        };
    }
  }

  // Legacy format (text only) - default contentType to 'text'
  return {
    id: option.id,
    text: option.text ?? null,
    text_sl: option.text_sl ?? null,
    text_hr: option.text_hr ?? null,
    imageUrl: null,
    altText: null,
    altText_sl: null,
    altText_hr: null,
    contentType: "text",
    imageSuffix: null,
    imageSuffix_sl: null,
    imageSuffix_hr: null,
    correct: option.isCorrect,
  };
}

/**
 * Batch transforms an array of Prisma options to app options
 */
export function prismaOptionsToApp(prismaOptions: PrismaOption[]): Option[] {
  return prismaOptions.map(prismaOptionToApp);
}

/**
 * Batch transforms an array of app options to Prisma inputs
 */
export function appOptionsToPrismaInputs(options: Option[]) {
  return options.map(appOptionToPrismaInput);
}

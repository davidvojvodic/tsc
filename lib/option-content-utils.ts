/**
 * Utility functions for handling Option content types
 * Supports backward compatibility between legacy text fields and new content system
 */

import type { Option, OptionTextContent, OptionMixedContent } from "@/components/quiz-editor/quiz-editor-layout";

export type Language = "en" | "sl" | "hr";
export type ContentType = "text" | "mixed";

/**
 * Detects if an option uses the new content system or legacy text fields
 */
export function hasContentSystem(option: Option): boolean {
  return option.content !== undefined;
}

/**
 * Gets the content type of an option
 * Returns "text" for legacy options
 */
export function getOptionContentType(option: Option): ContentType {
  if (option.content) {
    return option.content.type;
  }
  // Legacy options are considered "text" type
  return "text";
}

/**
 * Gets localized text from an option, supporting both legacy and new formats
 */
export function getLocalizedOptionText(
  option: Option,
  language: Language = "en"
): string {
  // New content system
  if (option.content) {
    const content = option.content;

    if (content.type === "text") {
      return getLocalizedText(content, language);
    }

    if (content.type === "mixed") {
      // For mixed content, return text
      return getLocalizedText(content, language);
    }
  }

  // Legacy text fields
  if (language === "sl" && option.text_sl) return option.text_sl;
  if (language === "hr" && option.text_hr) return option.text_hr;
  return option.text || "";
}

/**
 * Gets localized text from content object
 */
function getLocalizedText(
  content: OptionTextContent | OptionMixedContent,
  language: Language
): string {
  if (language === "sl" && content.text_sl) return content.text_sl;
  if (language === "hr" && content.text_hr) return content.text_hr;
  return content.text || "";
}

/**
 * Gets the image URL from an option if it has one
 */
export function getOptionImageUrl(option: Option): string | null {
  if (option.content) {
    if (option.content.type === "mixed") {
      return option.content.imageUrl || null;
    }
  }
  return null;
}

/**
 * Checks if an option has an image
 */
export function optionHasImage(option: Option): boolean {
  return getOptionImageUrl(option) !== null;
}

/**
 * Converts legacy option format to new content format
 * Useful for migrating existing options when editing
 */
export function legacyOptionToContent(option: Option): Option {
  // Already has content system
  if (option.content) {
    return option;
  }

  // Convert legacy text fields to text content
  const content: OptionTextContent = {
    type: "text",
    text: option.text || undefined,
    text_sl: option.text_sl || undefined,
    text_hr: option.text_hr || undefined,
  };

  return {
    ...option,
    content,
  };
}

/**
 * Converts new content format to legacy option format
 * Useful for backward compatibility when saving
 */
export function contentToLegacyOption(option: Option): Option {
  // No content system, return as-is
  if (!option.content) {
    return option;
  }

  // Extract text from content
  if (option.content.type === "text") {
    return {
      ...option,
      text: option.content.text || null,
      text_sl: option.content.text_sl || null,
      text_hr: option.content.text_hr || null,
    };
  }

  // For image/mixed types, keep content system
  return option;
}

/**
 * Validates if an option has required content in at least one language
 */
export function isValidOption(option: Option): boolean {
  // Check new content system
  if (option.content) {
    if (option.content.type === "text") {
      return !!(
        option.content.text?.trim() ||
        option.content.text_sl?.trim() ||
        option.content.text_hr?.trim()
      );
    }

    if (option.content.type === "mixed") {
      const hasText = !!(
        option.content.text?.trim() ||
        option.content.text_sl?.trim() ||
        option.content.text_hr?.trim()
      );
      const hasImage = !!option.content.imageUrl?.trim();
      return hasText || hasImage;
    }
  }

  // Check legacy text fields
  return !!(
    option.text?.trim() ||
    option.text_sl?.trim() ||
    option.text_hr?.trim()
  );
}

/**
 * Creates a default text-only option
 */
export function createDefaultOption(): Option {
  return {
    id: undefined,
    text: "",
    text_sl: "",
    text_hr: "",
    content: {
      type: "text",
      text: "",
      text_sl: "",
      text_hr: "",
    },
    isCorrect: false,
  };
}

/**
 * Creates a mixed content option (text + image)
 */
export function createMixedOption(
  text: string,
  imageUrl: string
): Option {
  return {
    id: undefined,
    text: null,
    text_sl: null,
    text_hr: null,
    content: {
      type: "mixed",
      text,
      imageUrl,
    },
    isCorrect: false,
  };
}

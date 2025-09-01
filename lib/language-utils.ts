import { SupportedLanguage } from "@/store/language-context";


/**
 * Gets localized content with fallback to English if translation is missing
 * @param content Object containing content in different languages
 * @param field Base field name (without language suffix)
 * @param language Current language code
 * @returns The content in the requested language or fallback to English
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalizedContent<T extends Record<string, any>>(
  content: T,
  field: string,
  language: SupportedLanguage
): string | null {
  // Check if content is null or undefined
  if (!content) {
    return null;
  }
  
  // For English, first check if there's an explicit English field
  if (language === "en") {
    const explicitEnglishField = `${field}_en`;
    return content[explicitEnglishField] || content[field] || null;
  }
  
  // For other languages, check the localized field
  const localizedField = `${field}_${language}`;
  
  // Return localized content if available, otherwise fall back to English
  return content[localizedField] || content[field] || null;
}
import { SupportedLanguage } from "@/components/ui/language-tabs";


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
  if (language === "en") {
    return content[field] || null;
  }
  
  const localizedField = `${field}_${language}`;
  
  // Return localized content if available, otherwise fall back to English
  return content[localizedField] || content[field] || null;
}
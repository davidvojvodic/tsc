// lib/multilingual-api.ts
import { NextRequest } from "next/server";
import { SupportedLanguage } from "@/store/language-context";

/**
 * Extracts language preference from request
 * Checks header, query parameter, and fallback to default
 */
export function getLanguageFromRequest(
  req: NextRequest,
  defaultLang: SupportedLanguage = "en"
): SupportedLanguage {
  // Check Accept-Language header
  const acceptLanguage = req.headers.get("Accept-Language");
  if (acceptLanguage) {
    if (acceptLanguage.includes("sl")) return "sl";
    if (acceptLanguage.includes("hr")) return "hr";
  }

  // Check URL for lang parameter
  const url = new URL(req.url);
  const langParam = url.searchParams.get("lang");
  if (langParam === "sl" || langParam === "hr") {
    return langParam;
  }

  return defaultLang;
}

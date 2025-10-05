"use client";

import { cn } from "@/lib/utils";
import { Language } from "./quiz-editor-provider";

interface LanguageTabsProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  hasContent: {
    en: boolean;
    sl: boolean;
    hr: boolean;
  };
}

const languageLabels: Record<Language, string> = {
  en: "English",
  sl: "Slovenian",
  hr: "Croatian"
};

const languageFlags: Record<Language, string> = {
  en: "🇬🇧",
  sl: "🇸🇮",
  hr: "🇭🇷"
};

export function LanguageTabs({
  currentLanguage,
  onLanguageChange,
  hasContent
}: LanguageTabsProps) {
  const languages: Language[] = ["en", "sl", "hr"];

  return (
    <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg p-1 gap-1">
      {languages.map((language) => (
        <button
          key={language}
          onClick={() => onLanguageChange(language)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all flex items-center gap-2",
            currentLanguage === language
              ? "text-blue-600 bg-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          )}
        >
          <span className="text-base">{languageFlags[language]}</span>
          <span>{languageLabels[language]}</span>

          {/* Content indicator */}
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              hasContent[language]
                ? "bg-green-500"
                : "bg-gray-300 opacity-50"
            )}
            title={
              hasContent[language]
                ? `${languageLabels[language]} content available`
                : `No ${languageLabels[language]} content`
            }
          />
        </button>
      ))}
    </div>
  );
}
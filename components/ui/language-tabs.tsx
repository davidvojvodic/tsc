"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

export type SupportedLanguage = "en" | "sl" | "hr";

export const languageOptions = [
  { id: "en", label: "English" },
  { id: "sl", label: "Slovenian" },
  { id: "hr", label: "Croatian" },
];

interface LanguageTabsProps {
  defaultValue?: SupportedLanguage;
  children: (language: SupportedLanguage) => ReactNode;
}

export function LanguageTabs({
  defaultValue = "en",
  children,
}: LanguageTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <TabsList className="mb-4">
        {languageOptions.map((lang) => (
          <TabsTrigger key={lang.id} value={lang.id}>
            {lang.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {languageOptions.map((lang) => (
        <TabsContent key={lang.id} value={lang.id} className="mt-0">
          {children(lang.id as SupportedLanguage)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

// components/language-selector.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, SupportedLanguage } from "@/store/language-context";
import { useEffect, useState } from "react";
import { setCookie } from 'cookies-next';

const languages = [
  { code: "en", name: "English" },
  { code: "sl", name: "Slovenščina" },
  { code: "hr", name: "Hrvatski" },
];

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const { language: contextLanguage, setLanguage: setContextLanguage } = useLanguage();
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("en");

  // Ensure we have the current language from the URL
  useEffect(() => {
    const pathParts = pathname.split("/").filter(Boolean);
    const pathLanguage = pathParts[0] && languages.some((l) => l.code === pathParts[0])
      ? pathParts[0] as SupportedLanguage
      : "en";
    
    setCurrentLang(pathLanguage);
    
    // Sync with cookie and context if needed
    if (pathLanguage !== contextLanguage) {
      setCookie('NEXT_LOCALE', pathLanguage, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    }
  }, [pathname, contextLanguage]);

  const handleLanguageChange = (lang: string) => {
    if (lang === currentLang) return;

    // Update context language (which will also set the cookie)
    setContextLanguage(lang as SupportedLanguage);
    
    // Also set cookie directly to ensure it takes effect
    setCookie('NEXT_LOCALE', lang, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    
    // Set current display language
    setCurrentLang(lang as SupportedLanguage);

    // Update URL to reflect language change
    const pathParts = pathname.split("/").filter(Boolean);

    // If first part is a language code, replace it
    if (languages.some((l) => l.code === pathParts[0])) {
      pathParts[0] = lang;
    } else {
      // Otherwise insert the language at the beginning
      pathParts.unshift(lang);
    }

    // Construct new path and navigate
    const newPath = `/${pathParts.join("/")}`;
    console.log(`Language changed to: ${lang}, redirecting to: ${newPath}`);
    router.push(newPath);
    
    // Force page reload to ensure server components re-render with new language
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = newPath;
      }, 100);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2">
          <Globe className="h-4 w-4 mr-1" />
          <span className="uppercase">{currentLang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`${lang.code === currentLang ? "bg-muted font-medium" : ""} rounded-md transition-colors`}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
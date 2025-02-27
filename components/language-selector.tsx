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

const languages = [
  { code: "en", name: "English" },
  { code: "sl", name: "Slovenščina" },
  { code: "hr", name: "Hrvatski" },
];

export function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();

  // Parse the current language from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const currentLang =
    pathParts[0] && languages.some((l) => l.code === pathParts[0])
      ? pathParts[0]
      : "en";

  const handleLanguageChange = (lang: string) => {
    if (lang === currentLang) return;

    const pathParts = pathname.split("/").filter(Boolean);

    // If first part is a language code, replace it
    if (languages.some((l) => l.code === pathParts[0])) {
      pathParts[0] = lang;
    } else {
      // Otherwise insert the language at the beginning
      pathParts.unshift(lang);
    }

    router.push(`/${pathParts.join("/")}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2">
          <Globe className="h-4 w-4 mr-1" />
          <span className="uppercase">{currentLang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={lang.code === currentLang ? "bg-muted font-medium" : ""}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

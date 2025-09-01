// store/language-context.tsx
"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { setCookie } from 'cookies-next';

export type SupportedLanguage = "en" | "sl" | "hr";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Initialize language from URL or default to 'en'
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    
    // Skip language routing for admin routes
    if (pathname?.startsWith("/admin")) {
      return;
    }

    // First check the URL for language
    const pathLanguage = pathname?.split("/")[1] as SupportedLanguage;
    if (["en", "sl", "hr"].includes(pathLanguage)) {
      setLanguageState(pathLanguage);
      if (typeof window !== 'undefined') {
        localStorage.setItem("preferredLanguage", pathLanguage);
      }
      // Also set cookie for server components
      setCookie('NEXT_LOCALE', pathLanguage, { path: '/', maxAge: 60 * 60 * 24 * 30 }); // 30 days
      return;
    }

    // If not in URL, check localStorage (only on client)
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem(
        "preferredLanguage"
      ) as SupportedLanguage;
      if (["en", "sl", "hr"].includes(storedLanguage)) {
        setLanguageState(storedLanguage);
        // Also set cookie for server components
        setCookie('NEXT_LOCALE', storedLanguage, { path: '/', maxAge: 60 * 60 * 24 * 30 }); // 30 days

        // Redirect to the localized URL if we're using stored language
        // BUT NOT FOR ADMIN ROUTES
        if (pathname && !pathname.startsWith("/admin")) {
          const newPathname = `/${storedLanguage}${pathname}`;
          router.push(newPathname);
        }
      }
    }
  }, [pathname, router]);

  // Also modify setLanguage to avoid redirecting admin routes
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem("preferredLanguage", lang);
    }
    // Set cookie for server-side components
    setCookie('NEXT_LOCALE', lang, { path: '/', maxAge: 60 * 60 * 24 * 30 }); // 30 days

    // Update URL to reflect language change - skip for admin routes
    if (pathname && !pathname.startsWith("/admin")) {
      const segments = pathname.split("/").filter(Boolean);
      
      // Check if the first segment is a language code
      if (segments.length > 0 && ["en", "sl", "hr"].includes(segments[0])) {
        segments[0] = lang;
      } else {
        segments.unshift(lang);
      }
      
      const newPath = `/${segments.join("/")}`;
      console.log('Language changed to:', lang, 'Redirecting to:', newPath);
      router.push(newPath);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
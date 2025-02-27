// store/language-context.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export type SupportedLanguage = 'en' | 'sl' | 'hr';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  
  // Initialize language from URL or localStorage or default to 'en'
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  
  // Initialize language from URL or localStorage
  useEffect(() => {
    // First check the URL for language
    const pathLanguage = pathname?.split('/')[1] as SupportedLanguage;
    if (['en', 'sl', 'hr'].includes(pathLanguage)) {
      setLanguageState(pathLanguage);
      localStorage.setItem('preferredLanguage', pathLanguage);
      return;
    }
    
    // If not in URL, check localStorage
    const storedLanguage = localStorage.getItem('preferredLanguage') as SupportedLanguage;
    if (['en', 'sl', 'hr'].includes(storedLanguage)) {
      setLanguageState(storedLanguage);
      
      // Redirect to the localized URL if we're using stored language
      if (pathname) {
        const newPathname = `/${storedLanguage}${pathname}`;
        router.push(newPathname);
      }
    }
  }, [pathname, router]);
  
  // When language changes, persist to localStorage and update URL
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
    
    // Update URL to reflect language change
    if (pathname) {
      const segments = pathname.split('/');
      if (['en', 'sl', 'hr'].includes(segments[1])) {
        segments[1] = lang;
      } else {
        segments.splice(1, 0, lang);
      }
      router.push(segments.join('/'));
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
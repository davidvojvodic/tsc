// lib/cookie-consent.ts
"use client";

import { SupportedLanguage } from "@/store/language-context";

export type CookieCategory = "essential" | "analytics" | "functional";

export interface CookieConsent {
  essential: boolean; // Always true, required for basic functionality
  analytics: boolean; // Google Analytics, usage tracking
  functional: boolean; // Enhanced features, preferences
}

export interface ConsentState {
  hasInteracted: boolean;
  consent: CookieConsent;
  timestamp: number;
  version: string; // For future consent updates
}

export const CONSENT_VERSION = "1.0";
export const CONSENT_STORAGE_KEY = "waterwise_cookie_consent";
export const CONSENT_COOKIE_NAME = "waterwise_consent";

// Default consent state - only essential cookies allowed
export const DEFAULT_CONSENT: ConsentState = {
  hasInteracted: false,
  consent: {
    essential: true,
    analytics: false,
    functional: false,
  },
  timestamp: Date.now(),
  version: CONSENT_VERSION,
};

// Cookie category definitions with descriptions
export const getCookieCategories = (language: SupportedLanguage) => {
  const translations = {
    en: {
      essential: {
        name: "Essential Cookies",
        description:
          "These cookies are necessary for the website to function properly. They enable basic features like authentication, security, and language preferences.",
        examples: "Authentication, security tokens, language settings",
        required: true,
      },
      analytics: {
        name: "Analytics Cookies",
        description:
          "These cookies help us understand how you use our platform to improve your learning experience and educational content.",
        examples:
          "Usage statistics, performance monitoring, learning progress tracking",
        required: false,
      },
      functional: {
        name: "Functional Cookies",
        description:
          "These cookies enhance your experience by remembering your preferences and providing personalized features.",
        examples:
          "Quiz progress, display preferences, learning path customization",
        required: false,
      },
    },
    sl: {
      essential: {
        name: "Bistveni piškotki",
        description:
          "Ti piškotki so potrebni za pravilno delovanje spletne strani. Omogočajo osnovne funkcije, kot so avtentifikacija, varnost in jezikovne preference.",
        examples: "Avtentifikacija, varnostni žetoni, jezikovne nastavitve",
        required: true,
      },
      analytics: {
        name: "Analitični piškotki",
        description:
          "Ti piškotki nam pomagajo razumeti, kako uporabljate našo platformo, da izboljšamo vašo učno izkušnjo in izobraževalno vsebino.",
        examples:
          "Statistike uporabe, spremljanje zmogljivosti, sledenje učnemu napredku",
        required: false,
      },
      functional: {
        name: "Funkcionalni piškotki",
        description:
          "Ti piškotki izboljšajo vašo izkušnjo z zapomnitvijo vaših preferenc in zagotavljanjem prilagojenih funkcij.",
        examples:
          "Napredek pri kvizih, preference prikaza, prilagoditev učne poti",
        required: false,
      },
    },
    hr: {
      essential: {
        name: "Osnovni kolačići",
        description:
          "Ovi kolačići su potrebni za ispravno funkcioniranje web stranice. Omogućavaju osnovne funkcije poput autentifikacije, sigurnosti i jezičnih preferencija.",
        examples: "Autentifikacija, sigurnosni tokeni, jezične postavke",
        required: true,
      },
      analytics: {
        name: "Analitički kolačići",
        description:
          "Ovi kolačići nam pomažu razumjeti kako koristite našu platformu za poboljšanje vašeg iskustva učenja i obrazovnog sadržaja.",
        examples:
          "Statistike korištenja, praćenje performansi, praćenje napretka učenja",
        required: false,
      },
      functional: {
        name: "Funkcionalni kolačići",
        description:
          "Ovi kolačići poboljšavaju vaše iskustvo pamćenjem vaših preferencija i pružanjem personaliziranih funkcija.",
        examples:
          "Napredak kvizova, preferencije prikaza, prilagođavanje putanje učenja",
        required: false,
      },
    },
  };

  return translations[language] || translations.en;
};

// Utility functions for consent management
export const saveConsent = (consentState: ConsentState): void => {
  try {
    // Save to localStorage for client-side access
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentState));

    // Set a cookie for server-side access (1 year expiry)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const cookieValue = JSON.stringify({
      consent: consentState.consent,
      timestamp: consentState.timestamp,
      version: consentState.version,
    });

    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(cookieValue)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error("Failed to save cookie consent:", error);
  }
};

export const loadConsent = (): ConsentState => {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return DEFAULT_CONSENT;

    const parsed = JSON.parse(stored) as ConsentState;

    // Check if consent version is outdated
    if (parsed.version !== CONSENT_VERSION) {
      return DEFAULT_CONSENT;
    }

    // Check if consent is older than 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > oneYear) {
      return DEFAULT_CONSENT;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load cookie consent:", error);
    return DEFAULT_CONSENT;
  }
};

export const clearConsent = (): void => {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    console.error("Failed to clear cookie consent:", error);
  }
};

// Check if specific cookie category is allowed
export const isCookieAllowed = (category: CookieCategory): boolean => {
  const consentState = loadConsent();
  return consentState.consent[category];
};

// Utility to get consent translations
export const getConsentTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      title: "Cookie Preferences",
      description:
        "We use cookies to enhance your learning experience on the WaterWise platform. You can choose which types of cookies you're comfortable with.",
      acceptAll: "Accept All Cookies",
      acceptEssential: "Accept Essential Only",
      customize: "Customize Settings",
      saveSettings: "Save Settings",
      allowAll: "Allow All",
      necessary: "Necessary",
      optional: "Optional",
      learnMore: "Learn more about our cookie policy",
      bannerText:
        "This website uses cookies to ensure you get the best learning experience. You can customize your cookie preferences at any time.",
      settingsTitle: "Cookie Settings",
      settingsDescription:
        "Manage your cookie preferences for the WaterWise educational platform. Essential cookies are required for basic functionality.",
      on: "On",
      off: "Off",
    },
    sl: {
      title: "Nastavitve piškotkov",
      description:
        "Uporabljamo piškotke za izboljšanje vaše učne izkušnje na platformi WaterWise. Izberete lahko, s katerimi vrstami piškotkov se strinjate.",
      acceptAll: "Sprejmi vse piškotke",
      acceptEssential: "Sprejmi samo bistvene",
      customize: "Prilagodi nastavitve",
      saveSettings: "Shrani nastavitve",
      allowAll: "Dovoli vse",
      necessary: "Potrebno",
      optional: "Izbirno",
      learnMore: "Več o naši politiki piškotkov",
      bannerText:
        "Ta spletna stran uporablja piškotke za zagotavljanje najboljše učne izkušnje. Nastavitve piškotkov lahko kadar koli prilagodite.",
      settingsTitle: "Nastavitve piškotkov",
      settingsDescription:
        "Upravljajte svoje preference piškotkov za izobraževalno platformo WaterWise. Bistveni piškotki so potrebni za osnovno funkcionalnost.",
      on: "Vključeno",
      off: "Izključeno",
    },
    hr: {
      title: "Postavke kolačića",
      description:
        "Koristimo kolačiće za poboljšanje vašeg iskustva učenja na WaterWise platformi. Možete odabrati s kojim vrstama kolačića se slažete.",
      acceptAll: "Prihvati sve kolačiće",
      acceptEssential: "Prihvati samo osnovne",
      customize: "Prilagodi postavke",
      saveSettings: "Spremi postavke",
      allowAll: "Dozvoli sve",
      necessary: "Potrebno",
      optional: "Izborno",
      learnMore: "Saznajte više o našoj politici kolačića",
      bannerText:
        "Ova web stranica koristi kolačiće za osiguravanje najboljeg iskustva učenja. Postavke kolačića možete prilagoditi u bilo koje vrijeme.",
      settingsTitle: "Postavke kolačića",
      settingsDescription:
        "Upravljajte svojim preferencijama kolačića za WaterWise obrazovnu platformu. Osnovni kolačići su potrebni za osnovnu funkcionalnost.",
      on: "Uključeno",
      off: "Isključeno",
    },
  };

  return translations[language] || translations.en;
};

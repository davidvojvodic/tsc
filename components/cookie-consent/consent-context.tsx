// components/cookie-consent/consent-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  ConsentState,
  CookieConsent,
  DEFAULT_CONSENT,
  saveConsent,
  loadConsent,
  clearConsent,
} from "@/lib/cookie-consent";

interface ConsentContextType {
  consentState: ConsentState;
  showBanner: boolean;
  showSettings: boolean;
  updateConsent: (consent: Partial<CookieConsent>) => void;
  acceptAll: () => void;
  acceptEssential: () => void;
  rejectAll: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  resetConsent: () => void;
  isLoading: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
};

interface ConsentProviderProps {
  children: ReactNode;
}

export const ConsentProvider = ({ children }: ConsentProviderProps) => {
  const [consentState, setConsentState] = useState<ConsentState>(DEFAULT_CONSENT);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent state on mount
  useEffect(() => {
    const loadInitialConsent = () => {
      try {
        const loaded = loadConsent();
        setConsentState(loaded);
        
        // Show banner if user hasn't interacted yet
        setShowBanner(!loaded.hasInteracted);
      } catch (error) {
        console.error("Failed to load initial consent:", error);
        setConsentState(DEFAULT_CONSENT);
        setShowBanner(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent hydration issues
    const timer = setTimeout(loadInitialConsent, 100);
    return () => clearTimeout(timer);
  }, []);

  const updateConsentState = (newConsent: CookieConsent, hasInteracted = true) => {
    const newState: ConsentState = {
      hasInteracted,
      consent: newConsent,
      timestamp: Date.now(),
      version: consentState.version,
    };

    setConsentState(newState);
    saveConsent(newState);
    
    if (hasInteracted) {
      setShowBanner(false);
    }
  };

  const updateConsent = (consent: Partial<CookieConsent>) => {
    const newConsent: CookieConsent = {
      ...consentState.consent,
      ...consent,
      essential: true, // Essential cookies are always required
    };
    
    updateConsentState(newConsent);
  };

  const acceptAll = () => {
    updateConsentState({
      essential: true,
      analytics: true,
      functional: true,
    });
    setShowSettings(false);
  };

  const acceptEssential = () => {
    updateConsentState({
      essential: true,
      analytics: false,
      functional: false,
    });
    setShowSettings(false);
  };

  const rejectAll = () => {
    // Same as accept essential since we can't reject essential cookies
    acceptEssential();
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const resetConsent = () => {
    clearConsent();
    setConsentState(DEFAULT_CONSENT);
    setShowBanner(true);
    setShowSettings(false);
  };

  const value: ConsentContextType = {
    consentState,
    showBanner,
    showSettings,
    updateConsent,
    acceptAll,
    acceptEssential,
    rejectAll,
    openSettings,
    closeSettings,
    resetConsent,
    isLoading,
  };

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
};
// hooks/use-cookie-consent.ts
"use client";

import { useEffect, useState } from "react";
import { 
  CookieCategory, 
  isCookieAllowed, 
  loadConsent,
  ConsentState 
} from "@/lib/cookie-consent";

interface UseCookieConsentReturn {
  isAllowed: (category: CookieCategory) => boolean;
  canUseAnalytics: boolean;
  canUseFunctional: boolean;
  consentState: ConsentState | null;
  isLoading: boolean;
}

/**
 * Hook for checking cookie consent status and managing conditional feature loading
 */
export const useCookieConsent = (): UseCookieConsentReturn => {
  const [consentState, setConsentState] = useState<ConsentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConsent = () => {
      try {
        const state = loadConsent();
        setConsentState(state);
      } catch (error) {
        console.error("Failed to load consent state:", error);
        setConsentState(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkConsent();

    // Listen for consent changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "waterwise_cookie_consent") {
        checkConsent();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isAllowed = (category: CookieCategory): boolean => {
    if (isLoading || !consentState) {
      // During loading or if no consent, only allow essential
      return category === "essential";
    }
    return consentState.consent[category];
  };

  return {
    isAllowed,
    canUseAnalytics: isAllowed("analytics"),
    canUseFunctional: isAllowed("functional"),
    consentState,
    isLoading,
  };
};

/**
 * Hook for conditionally executing code based on cookie consent
 */
export const useConditionalScript = (
  category: CookieCategory,
  callback: () => void,
  dependencies: any[] = []
) => {
  const { isAllowed, isLoading } = useCookieConsent();

  useEffect(() => {
    if (!isLoading && isAllowed(category)) {
      callback();
    }
  }, [category, isLoading, isAllowed, ...dependencies]);
};

/**
 * Hook for managing analytics consent specifically
 */
export const useAnalytics = () => {
  const { canUseAnalytics, isLoading } = useCookieConsent();
  
  return {
    canTrack: canUseAnalytics,
    isReady: !isLoading,
    trackEvent: (event: string, properties?: Record<string, any>) => {
      if (canUseAnalytics) {
        // Your analytics tracking code here
        console.log("Analytics event:", event, properties);
        // Example: gtag('event', event, properties);
      }
    },
    trackPageView: (page: string) => {
      if (canUseAnalytics) {
        // Your page view tracking code here
        console.log("Analytics page view:", page);
        // Example: gtag('config', 'GA_TRACKING_ID', { page_path: page });
      }
    },
  };
};
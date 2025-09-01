// lib/cookie-consent-server.ts
import { cookies } from "next/headers";
import { 
  CookieCategory, 
  CookieConsent, 
  CONSENT_COOKIE_NAME,
  DEFAULT_CONSENT 
} from "./cookie-consent";

/**
 * Server-side utility to check cookie consent from request cookies
 * Useful for SSR components that need to conditionally render based on consent
 */
export const getServerConsent = async (): Promise<CookieConsent> => {
  try {
    const cookieStore = await cookies();
    const consentCookie = cookieStore.get(CONSENT_COOKIE_NAME);
    
    if (!consentCookie?.value) {
      return DEFAULT_CONSENT.consent;
    }
    
    const decoded = decodeURIComponent(consentCookie.value);
    const parsed = JSON.parse(decoded);
    
    return {
      essential: true, // Always true
      analytics: parsed.consent?.analytics || false,
      functional: parsed.consent?.functional || false,
    };
  } catch (error) {
    console.error("Failed to parse server consent:", error);
    return DEFAULT_CONSENT.consent;
  }
};

/**
 * Check if a specific cookie category is allowed on the server
 */
export const isServerConsentAllowed = async (category: CookieCategory): Promise<boolean> => {
  const consent = await getServerConsent();
  return consent[category];
};

/**
 * Server-side utility to get consent status for analytics
 */
export const canUseServerAnalytics = async (): Promise<boolean> => {
  return await isServerConsentAllowed("analytics");
};

/**
 * Server-side utility to get consent status for functional cookies
 */
export const canUseServerFunctional = async (): Promise<boolean> => {
  return await isServerConsentAllowed("functional");
};
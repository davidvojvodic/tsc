// components/cookie-consent/cookie-consent.tsx
"use client";

import React from "react";
import { ConsentProvider } from "./consent-context";
import { CookieBanner } from "./cookie-banner";
import { CookieSettingsModal } from "./cookie-settings-modal";

interface CookieConsentProps {
  children: React.ReactNode;
}

// Main cookie consent component that provides context and renders UI
export const CookieConsent = ({ children }: CookieConsentProps) => {
  return (
    <ConsentProvider>
      {children}
      <CookieBanner />
      <CookieSettingsModal />
    </ConsentProvider>
  );
};

// Re-export hook for convenience
export { useConsent } from "./consent-context";
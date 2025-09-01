// components/cookie-consent/cookie-settings-button.tsx
"use client";

import React from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/store/language-context";
import { useConsent } from "./consent-context";
import { getConsentTranslations } from "@/lib/cookie-consent";

interface CookieSettingsButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  className?: string;
}

export const CookieSettingsButton = ({ 
  variant = "ghost", 
  size = "sm", 
  showIcon = true,
  className = ""
}: CookieSettingsButtonProps) => {
  const { language } = useLanguage();
  const { openSettings } = useConsent();
  const t = getConsentTranslations(language);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openSettings}
      className={className}
    >
      {showIcon && <Cookie className="h-4 w-4 mr-2" />}
      {t.customize}
    </Button>
  );
};
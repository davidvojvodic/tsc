// components/cookie-consent/cookie-banner.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Cookie, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/store/language-context";
import { useConsent } from "./consent-context";
import { getConsentTranslations } from "@/lib/cookie-consent";

export const CookieBanner = () => {
  const { language } = useLanguage();
  const { showBanner, acceptAll, acceptEssential, openSettings, isLoading } =
    useConsent();

  const t = getConsentTranslations(language);

  // Don't render anything while loading or if banner shouldn't be shown
  if (isLoading || !showBanner) {
    return null;
  }

  // Get the correct privacy policy link based on language
  const privacyLink = language === "en" ? "/privacy" : `/${language}/privacy`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Icon and text content */}
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 mt-1">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{t.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t.bannerText}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <Link
                      href={privacyLink}
                      className="text-primary hover:underline"
                    >
                      {t.learnMore}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openSettings}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {t.customize}
                </Button>
                <Button variant="outline" size="sm" onClick={acceptEssential}>
                  {t.acceptEssential}
                </Button>
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t.acceptAll}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// components/cookie-consent/cookie-settings-modal.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Shield, BarChart3, Sliders } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/store/language-context";
import { useConsent } from "./consent-context";
import { 
  getConsentTranslations, 
  getCookieCategories,
  CookieCategory,
  CookieConsent 
} from "@/lib/cookie-consent";

const getCategoryIcon = (category: CookieCategory) => {
  const iconProps = { className: "h-5 w-5" };
  
  switch (category) {
    case 'essential':
      return <Shield {...iconProps} />;
    case 'analytics':
      return <BarChart3 {...iconProps} />;
    case 'functional':
      return <Sliders {...iconProps} />;
    default:
      return <Cookie {...iconProps} />;
  }
};

export const CookieSettingsModal = () => {
  const { language } = useLanguage();
  const { 
    showSettings, 
    closeSettings, 
    consentState, 
    updateConsent,
    acceptAll,
    acceptEssential 
  } = useConsent();
  
  const [localConsent, setLocalConsent] = useState<CookieConsent>(consentState.consent);
  
  const t = getConsentTranslations(language);
  const categories = getCookieCategories(language);

  // Update local state when consent state changes
  useEffect(() => {
    setLocalConsent(consentState.consent);
  }, [consentState.consent]);

  const handleCategoryToggle = (category: CookieCategory, enabled: boolean) => {
    if (category === 'essential') return; // Essential cookies cannot be disabled
    
    setLocalConsent(prev => ({
      ...prev,
      [category]: enabled,
    }));
  };

  const handleSaveSettings = () => {
    updateConsent(localConsent);
    closeSettings();
  };

  const handleAcceptAll = () => {
    setLocalConsent({
      essential: true,
      analytics: true,
      functional: true,
    });
    acceptAll();
  };

  const handleAcceptEssential = () => {
    setLocalConsent({
      essential: true,
      analytics: false,
      functional: false,
    });
    acceptEssential();
  };

  // Get the correct privacy policy link based on language
  const privacyLink = language === "en" ? "/privacy" : `/${language}/privacy`;
  const cookieLink = language === "en" ? "/cookies" : `/${language}/cookies`;

  const categoryOrder: CookieCategory[] = ['essential', 'analytics', 'functional'];

  return (
    <Dialog open={showSettings} onOpenChange={closeSettings}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary" />
            {t.settingsTitle}
          </DialogTitle>
          <DialogDescription>
            {t.settingsDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptAll}
            >
              {t.allowAll}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptEssential}
            >
              {t.acceptEssential}
            </Button>
          </div>

          <Separator />

          {/* Cookie Categories */}
          <div className="space-y-4">
            {categoryOrder.map((categoryKey) => {
              const category = categories[categoryKey];
              const isEnabled = localConsent[categoryKey];
              const isRequired = category.required;

              return (
                <Card key={categoryKey} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {getCategoryIcon(categoryKey)}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {category.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={isRequired ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {isRequired ? t.necessary : t.optional}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {isEnabled ? t.on : t.off}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleCategoryToggle(categoryKey, checked)}
                        disabled={isRequired}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {category.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <strong>Examples:</strong> {category.examples}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Learn More</h4>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Link 
                href={privacyLink}
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
              <Link 
                href={cookieLink}
                className="text-primary hover:underline"
              >
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={closeSettings}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="flex-1"
            >
              {t.saveSettings}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
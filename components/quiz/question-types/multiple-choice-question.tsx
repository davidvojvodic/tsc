"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getLocalizedContent } from "@/lib/language-utils";
import { SupportedLanguage } from "@/store/language-context";
import { AlertCircle, CheckCircle } from "lucide-react";

interface Option {
  id: string;
  text: string;
  text_sl?: string | null;
  text_hr?: string | null;
  isCorrect: boolean;
}

interface MultipleChoiceData {
  scoringMethod: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
  minSelections: number;
  maxSelections?: number;
  partialCreditRules?: {
    correctSelectionPoints: number;
    incorrectSelectionPenalty: number;
    minScore: number;
  };
}

interface MultipleChoiceQuestionProps {
  questionId: string;
  text: string;
  text_sl?: string | null;
  text_hr?: string | null;
  options: Option[];
  multipleChoiceData: MultipleChoiceData;
  selectedOptions: string[];
  onSelectionChange: (questionId: string, selectedOptions: string[]) => void;
  disabled?: boolean;
  showValidation?: boolean;
  language?: SupportedLanguage;
  className?: string;
}

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      selectAtLeast: "Select at least",
      selectAtMost: "Select at most",
      option: "option",
      options: "options",
      selected: "selected",
      validSelection: "Valid selection",
      invalidSelection: "Invalid selection",
      chooseMinimum: "Please choose at least",
      chooseMaximum: "Please choose at most",
      selectBetween: "Select between",
      and: "and",
    },
    sl: {
      selectAtLeast: "Izberite vsaj",
      selectAtMost: "Izberite največ",
      option: "možnost",
      options: "možnosti",
      selected: "izbrano",
      validSelection: "Veljavna izbira",
      invalidSelection: "Neveljavna izbira",
      chooseMinimum: "Prosimo izberite vsaj",
      chooseMaximum: "Prosimo izberite največ",
      selectBetween: "Izberite med",
      and: "in",
    },
    hr: {
      selectAtLeast: "Odaberite najmanje",
      selectAtMost: "Odaberite najviše",
      option: "opciju",
      options: "opcija",
      selected: "odabrano",
      validSelection: "Valjani odabir",
      invalidSelection: "Nevažeći odabir",
      chooseMinimum: "Molimo odaberite najmanje",
      chooseMaximum: "Molimo odaberite najviše",
      selectBetween: "Odaberite između",
      and: "i",
    },
  };
  return translations[language];
};

export function MultipleChoiceQuestion({
  questionId,
  text,
  text_sl,
  text_hr,
  options,
  multipleChoiceData,
  selectedOptions,
  onSelectionChange,
  disabled = false,
  showValidation = true,
  language = "en",
  className,
}: MultipleChoiceQuestionProps) {
  const t = getTranslations(language);

  const { minSelections, maxSelections } = multipleChoiceData;
  const selectedCount = selectedOptions.length;

  // Validation state
  const isMinimumMet = selectedCount >= minSelections;
  const isMaximumExceeded = maxSelections ? selectedCount > maxSelections : false;
  const isValid = isMinimumMet && !isMaximumExceeded;

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (disabled) return;

    let newSelectedOptions: string[];

    if (checked) {
      // Check if adding this option would exceed the maximum
      if (maxSelections && selectedCount >= maxSelections) {
        return; // Don't allow selection if at maximum
      }
      newSelectedOptions = [...selectedOptions, optionId];
    } else {
      newSelectedOptions = selectedOptions.filter(id => id !== optionId);
    }

    onSelectionChange(questionId, newSelectedOptions);
  };

  const getSelectionLimitText = () => {
    if (maxSelections) {
      if (minSelections === maxSelections) {
        return `${t.selectAtLeast} ${minSelections} ${minSelections === 1 ? t.option : t.options}`;
      } else {
        return `${t.selectBetween} ${minSelections} ${t.and} ${maxSelections} ${t.options}`;
      }
    } else {
      return `${t.selectAtLeast} ${minSelections} ${minSelections === 1 ? t.option : t.options}`;
    }
  };

  const getValidationMessage = () => {
    if (!showValidation) return null;

    if (!isMinimumMet) {
      return (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t.chooseMinimum} {minSelections} {minSelections === 1 ? t.option : t.options}
          </AlertDescription>
        </Alert>
      );
    }

    if (isMaximumExceeded) {
      return (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t.chooseMaximum} {maxSelections} {t.options}
          </AlertDescription>
        </Alert>
      );
    }

    if (isValid && selectedCount > 0) {
      return (
        <Alert className="mt-3 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {t.validSelection}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Question text */}
      <div className="space-y-2">
        <h3 className="text-xl font-medium">
          {getLocalizedContent({ text, text_sl, text_hr }, "text", language)}
        </h3>

        {/* Selection info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{getSelectionLimitText()}</span>
          {selectedCount > 0 && (
            <Badge
              variant={isValid ? "default" : "destructive"}
              className="text-xs"
            >
              {selectedCount} {t.selected}
            </Badge>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const isOptionDisabled = Boolean(disabled ||
            (!isSelected && maxSelections && selectedCount >= maxSelections));

          return (
            <div
              key={option.id}
              className={cn(
                "flex items-start space-x-3 rounded-lg border p-4 transition-colors",
                isSelected && "bg-blue-50 border-blue-200",
                !isOptionDisabled && "cursor-pointer hover:bg-muted/50",
                isOptionDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Checkbox
                id={option.id}
                checked={isSelected}
                onCheckedChange={(checked) =>
                  handleOptionChange(option.id, checked as boolean)
                }
                disabled={isOptionDisabled}
                className="mt-0.5"
              />
              <Label
                htmlFor={option.id}
                className={cn(
                  "flex-1 text-sm leading-relaxed",
                  !isOptionDisabled && "cursor-pointer"
                )}
              >
                {getLocalizedContent(option, "text", language)}
              </Label>
            </div>
          );
        })}
      </div>

      {/* Validation message */}
      {getValidationMessage()}
    </div>
  );
}
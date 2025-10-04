"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getLocalizedContent } from "@/lib/language-utils";
import { SupportedLanguage } from "@/store/language-context";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import Image from "next/image";

interface TextInputData {
  inputType?: "text" | "number" | "email" | "url"; // Optional for backward compatibility
  acceptableAnswers: string[];
  caseSensitive: boolean;
  numericTolerance?: number;
  placeholder?: string;
  placeholder_sl?: string;
  placeholder_hr?: string;
}

interface TextInputQuestionProps {
  questionId: string;
  text: string;
  text_sl?: string | null;
  text_hr?: string | null;
  imageUrl?: string | null;
  textInputData: TextInputData;
  answer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  disabled?: boolean;
  showValidation?: boolean;
  language?: SupportedLanguage;
  className?: string;
}

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      enterYourAnswer: "Enter your answer",
      validAnswer: "Valid answer format",
      invalidEmail: "Please enter a valid email address",
      invalidUrl: "Please enter a valid URL",
      invalidNumber: "Please enter a valid number",
      answerRequired: "Answer is required",
      textInput: "Text input",
      numberInput: "Number input",
      emailInput: "Email input",
      urlInput: "URL input",
    },
    sl: {
      enterYourAnswer: "Vnesite svoj odgovor",
      validAnswer: "Veljavna oblika odgovora",
      invalidEmail: "Prosimo vnesite veljaven e-naslov",
      invalidUrl: "Prosimo vnesite veljaven URL",
      invalidNumber: "Prosimo vnesite veljavno število",
      answerRequired: "Odgovor je obvezen",
      textInput: "Vnos besedila",
      numberInput: "Vnos števila",
      emailInput: "Vnos e-naslova",
      urlInput: "Vnos URL-ja",
    },
    hr: {
      enterYourAnswer: "Unesite svoj odgovor",
      validAnswer: "Valiäajn format odgovora",
      invalidEmail: "Molimo unesite valjanu email adresu",
      invalidUrl: "Molimo unesite valjani URL",
      invalidNumber: "Molimo unesite valjani broj",
      answerRequired: "Odgovor je obavezan",
      textInput: "Unos teksta",
      numberInput: "Unos broja",
      emailInput: "Unos emaila",
      urlInput: "Unos URL-a",
    },
  };
  return translations[language];
};

export function TextInputQuestion({
  questionId,
  text,
  text_sl,
  text_hr,
  imageUrl,
  textInputData,
  answer,
  onAnswerChange,
  disabled = false,
  showValidation = true,
  language = "en",
  className,
}: TextInputQuestionProps) {
  const t = getTranslations(language);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [validationMessage, setValidationMessage] = useState<string>("");

  const { inputType = "text", placeholder, placeholder_sl, placeholder_hr } = textInputData;

  // Get localized placeholder
  const localizedPlaceholder = getLocalizedContent(
    { text: placeholder, text_sl: placeholder_sl, text_hr: placeholder_hr },
    "text",
    language
  ) || t.enterYourAnswer;

  // Validation logic
  useEffect(() => {
    if (!answer.trim()) {
      setIsValid(true);
      setValidationMessage("");
      return;
    }

    switch (inputType) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailValid = emailRegex.test(answer);
        setIsValid(emailValid);
        setValidationMessage(emailValid ? t.validAnswer : t.invalidEmail);
        break;

      case "url":
        try {
          new URL(answer);
          setIsValid(true);
          setValidationMessage(t.validAnswer);
        } catch {
          setIsValid(false);
          setValidationMessage(t.invalidUrl);
        }
        break;

      case "number":
        const numberValue = parseFloat(answer);
        const numberValid = !isNaN(numberValue) && isFinite(numberValue);
        setIsValid(numberValid);
        setValidationMessage(numberValid ? t.validAnswer : t.invalidNumber);
        break;

      case "text":
      default:
        setIsValid(true);
        setValidationMessage(answer.trim() ? t.validAnswer : "");
        break;
    }
  }, [answer, inputType, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onAnswerChange(questionId, e.target.value);
  };

  const getInputTypeLabel = () => {
    switch (inputType) {
      case "number": return t.numberInput;
      case "email": return t.emailInput;
      case "url": return t.urlInput;
      case "text":
      default: return t.textInput;
    }
  };

  const getValidationAlert = () => {
    if (!showValidation || !answer.trim()) return null;

    if (!isValid) {
      return (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationMessage}</AlertDescription>
        </Alert>
      );
    }

    if (isValid && answer.trim()) {
      return (
        <Alert className="mt-3 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {validationMessage}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Question Image (if provided) */}
      {imageUrl && (
        <div className="w-full max-w-2xl mx-auto">
          <Image
            src={imageUrl}
            alt="Question image"
            width={800}
            height={600}
            className="w-full h-auto rounded-lg border shadow-sm"
            priority
          />
        </div>
      )}

      {/* Question text (only show if text exists) */}
      {text && text.trim() && (
        <div className="space-y-2">
          <h3 className="text-xl font-medium">
            {getLocalizedContent({ text, text_sl, text_hr }, "text", language)}
          </h3>

          {/* Input type info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>{getInputTypeLabel()}</span>
            {answer.trim() && (
              <Badge
                variant={isValid ? "default" : "destructive"}
                className="text-xs"
              >
                {isValid ? "Valid" : "Invalid"}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Input field */}
      <div className="space-y-2">
        <Label htmlFor={questionId} className="sr-only">
          {getLocalizedContent({ text, text_sl, text_hr }, "text", language)}
        </Label>
        <Input
          id={questionId}
          type={inputType === "number" ? "number" : inputType === "url" ? "url" : inputType === "email" ? "email" : "text"}
          value={answer}
          onChange={handleInputChange}
          placeholder={localizedPlaceholder}
          disabled={disabled}
          className={cn(
            "text-base py-3 px-4",
            !isValid && answer.trim() && "border-red-300 focus-visible:ring-red-500",
            isValid && answer.trim() && "border-green-300 focus-visible:ring-green-500"
          )}
          step={inputType === "number" ? "any" : undefined}
        />
      </div>

      {/* Validation message */}
      {getValidationAlert()}
    </div>
  );
}
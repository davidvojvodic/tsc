"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getLocalizedContent } from "@/lib/language-utils";
import { SupportedLanguage } from "@/store/language-context";
import { CheckCircle2, XCircle } from "lucide-react";

interface DropdownOption {
  id: string;
  text: string;
  text_sl?: string;
  text_hr?: string;
  isCorrect: boolean;
}

interface DropdownField {
  id: string;
  label: string;
  label_sl?: string;
  label_hr?: string;
  options: DropdownOption[];
}

interface DropdownConfiguration {
  template: string;
  template_sl?: string;
  template_hr?: string;
  dropdowns: DropdownField[];
  scoring?: {
    pointsPerDropdown: number;
    requireAllCorrect: boolean;
    penalizeIncorrect: boolean;
  };
}

interface DropdownQuestionProps {
  questionId: string;
  text: string;
  text_sl?: string | null;
  text_hr?: string | null;
  dropdownData: DropdownConfiguration;
  selectedAnswers?: Record<string, string>;
  onAnswerChange: (questionId: string, answers: Record<string, string>) => void;
  disabled?: boolean;
  showResults?: boolean;
  results?: Array<{
    dropdownId: string;
    isCorrect: boolean;
    selectedOption: string;
    correctOptions: string[];
  }>;
  language?: SupportedLanguage;
  className?: string;
}

export function DropdownQuestion({
  questionId,
  text,
  text_sl,
  text_hr,
  dropdownData,
  selectedAnswers = {},
  onAnswerChange,
  disabled = false,
  showResults = false,
  results = [],
  language = "en",
  className,
}: DropdownQuestionProps) {
  const [selections, setSelections] = useState<Record<string, string>>(selectedAnswers);

  useEffect(() => {
    setSelections(selectedAnswers);
  }, [selectedAnswers]);

  const handleSelectionChange = (dropdownId: string, optionId: string) => {
    const newSelections = { ...selections, [dropdownId]: optionId };
    setSelections(newSelections);
    onAnswerChange(questionId, newSelections);
  };

  const getTemplate = () => {
    return getLocalizedContent(dropdownData, "template", language) || dropdownData.template;
  };

  const renderTemplateWithDropdowns = () => {
    const template = getTemplate();
    const parts = template.split(/(\{[^}]+\})/);

    return parts.map((part, index) => {
      const match = part.match(/^\{([^}]+)\}$/);

      if (match) {
        const dropdownId = match[1];
        const dropdown = dropdownData.dropdowns.find(d => d.id === dropdownId);

        if (!dropdown) {
          return <span key={index} className="text-red-500">[Missing dropdown: {dropdownId}]</span>;
        }

        const result = results.find(r => r.dropdownId === dropdownId);
        const isCorrect = result?.isCorrect;
        const hasResult = showResults && result;

        return (
          <span key={index} className="inline-flex items-center gap-2 mx-1">
            <Select
              value={selections[dropdownId] || ""}
              onValueChange={(value) => handleSelectionChange(dropdownId, value)}
              disabled={disabled}
            >
              <SelectTrigger
                className={`
                  inline-flex min-w-[120px] h-8 px-2 py-1 text-sm
                  ${hasResult ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}
                `}
              >
                <SelectValue
                  placeholder={getLocalizedContent(dropdown, "label", language) || dropdown.label}
                />
              </SelectTrigger>
              <SelectContent>
                {dropdown.options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {getLocalizedContent(option, "text", language) || option.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasResult && (
              <span className="inline-flex">
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </span>
            )}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Question text */}
      <div className="space-y-2">
        <h3 className="text-xl font-medium">
          {getLocalizedContent({ text, text_sl, text_hr }, "text", language)}
        </h3>
      </div>

      {/* Template with dropdowns */}
      <div className="text-base leading-relaxed">
        {renderTemplateWithDropdowns()}
      </div>

      {/* Progress indicator */}
      {!showResults && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {Object.keys(selections).length} / {dropdownData.dropdowns.length} selections made
          </span>
          <div className="flex gap-1">
            {dropdownData.dropdowns.map((dropdown) => (
              <Badge
                key={dropdown.id}
                variant={selections[dropdown.id] ? "default" : "outline"}
                className="h-2 w-2 p-0 rounded-full"
              />
            ))}
          </div>
        </div>
      )}

      {/* Results summary */}
      {showResults && results.length > 0 && (
        <Alert variant={results.every(r => r.isCorrect) ? "default" : "destructive"}>
          <AlertDescription>
            {results.every(r => r.isCorrect)
              ? "Perfect! All selections are correct."
              : `${results.filter(r => r.isCorrect).length}/${results.length} correct selections`
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
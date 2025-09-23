"use client";

// import { useState } from "react"; // Removed unused import
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Question, Option } from "./quiz-editor-layout";
import { Language } from "./quiz-editor-provider";
import { cn } from "@/lib/utils";

interface OptionsEditorProps {
  question: Question;
  language: Language;
  onChange: (field: string, value: Option[]) => void;
}

export function OptionsEditor({
  question,
  language,
  onChange
}: OptionsEditorProps) {
  const getTextFieldName = (baseField: string) => {
    if (language === "sl") return `${baseField}_sl`;
    if (language === "hr") return `${baseField}_hr`;
    return baseField;
  };

  const getPlaceholder = (optionIndex: number, language: Language) => {
    switch (language) {
      case "sl":
        return `Možnost ${optionIndex + 1} v slovenščini`;
      case "hr":
        return `Opcija ${optionIndex + 1} na hrvatskom`;
      default:
        return `Option ${optionIndex + 1} in English`;
    }
  };

  const addOption = () => {
    const newOption: Option = {
      id: Math.random().toString(36).substr(2, 9),
      text: "",
      text_sl: "",
      text_hr: "",
      isCorrect: false
    };

    const newOptions = [...question.options, newOption];
    onChange("options", newOptions);
  };

  const removeOption = (optionIndex: number) => {
    if (question.options.length <= 2) return; // Minimum 2 options

    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    onChange("options", newOptions);
  };

  const updateOption = (optionIndex: number, field: keyof Option, value: string | boolean) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      [field]: value
    };

    // For single choice, ensure only one option is correct
    if (field === "isCorrect" && value && question.questionType === "SINGLE_CHOICE") {
      newOptions.forEach((option, index) => {
        if (index !== optionIndex) {
          option.isCorrect = false;
        }
      });
    }

    onChange("options", newOptions);
  };

  const textFieldName = getTextFieldName("text");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Answer Options</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Option
        </Button>
      </div>

      <div className="space-y-3">
        {question.options.map((option, optionIndex) => {
          // Get the appropriate text field based on language
          let currentText = "";
          if (textFieldName === "text") currentText = option.text || "";
          else if (textFieldName === "text_sl") currentText = option.text_sl || "";
          else if (textFieldName === "text_hr") currentText = option.text_hr || "";

          return (
            <Card key={option.id || optionIndex} className="border-dashed">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Correct option selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type={question.questionType === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                        name={question.questionType === "SINGLE_CHOICE" ? "correct-option" : undefined}
                        checked={option.isCorrect}
                        onChange={(e) => updateOption(optionIndex, "isCorrect", e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label className="text-sm font-normal cursor-pointer">
                        {question.questionType === "SINGLE_CHOICE"
                          ? "This is the correct answer"
                          : "This is a correct answer"
                        }
                      </Label>
                    </div>

                    {question.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeOption(optionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Option text */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">
                        Option Text ({language.toUpperCase()})
                      </Label>
                      <Input
                        value={currentText}
                        onChange={(e) => updateOption(optionIndex, textFieldName as keyof Option, e.target.value)}
                        placeholder={getPlaceholder(optionIndex, language)}
                        className={cn(
                          option.isCorrect && "border-green-300 bg-green-50"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Validation messages */}
      {question.options.length < 2 && (
        <p className="text-sm text-red-600">
          At least 2 options are required
        </p>
      )}

      {question.questionType === "SINGLE_CHOICE" &&
       question.options.filter(o => o.isCorrect).length !== 1 && (
        <p className="text-sm text-red-600">
          Exactly one option must be marked as correct for single choice questions
        </p>
      )}

      {question.questionType === "MULTIPLE_CHOICE" &&
       question.options.filter(o => o.isCorrect).length === 0 && (
        <p className="text-sm text-red-600">
          At least one option must be marked as correct for multiple choice questions
        </p>
      )}
    </div>
  );
}
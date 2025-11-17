"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Question, Option, OptionContent } from "./quiz-editor-layout";
import { Language } from "./quiz-editor-provider";
import { cn } from "@/lib/utils";
import { OptionImageUploader } from "./option-image-uploader";
import { getOptionContentType } from "@/lib/option-content-utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
      id: undefined,
      // Initialize legacy fields as empty strings (not null) for better compatibility
      text: "",
      text_sl: "",
      text_hr: "",
      // New content system
      content: {
        type: "text",
        text: "",
        text_sl: "",
        text_hr: "",
      },
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

  const updateOption = (optionIndex: number, updates: Partial<Option>) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      ...updates
    };

    // For single choice, ensure only one option is correct
    if (updates.isCorrect && question.questionType === "SINGLE_CHOICE") {
      newOptions.forEach((option, index) => {
        if (index !== optionIndex) {
          option.isCorrect = false;
        }
      });
    }

    onChange("options", newOptions);
  };

  const switchContentType = (optionIndex: number, newType: "text" | "mixed") => {
    const option = question.options[optionIndex];
    let newContent: OptionContent;

    switch (newType) {
      case "text":
        // Convert to text content, preserve existing text if any
        newContent = {
          type: "text",
          text: option.content?.type === "text" ? option.content.text :
                option.content?.type === "mixed" ? option.content.text :
                option.text || "",
          text_sl: option.content?.type === "text" ? option.content.text_sl :
                   option.content?.type === "mixed" ? option.content.text_sl :
                   option.text_sl || "",
          text_hr: option.content?.type === "text" ? option.content.text_hr :
                   option.content?.type === "mixed" ? option.content.text_hr :
                   option.text_hr || "",
        };
        break;

      case "mixed":
        // Convert to mixed content, preserve both text and image if available
        newContent = {
          type: "mixed",
          text: option.content?.type === "text" ? option.content.text :
                option.content?.type === "mixed" ? option.content.text :
                option.text || "",
          text_sl: option.content?.type === "text" ? option.content.text_sl :
                   option.content?.type === "mixed" ? option.content.text_sl :
                   option.text_sl || "",
          text_hr: option.content?.type === "text" ? option.content.text_hr :
                   option.content?.type === "mixed" ? option.content.text_hr :
                   option.text_hr || "",
          imageUrl: option.content?.type === "mixed" ? option.content.imageUrl : undefined,
        };
        break;
    }

    // Sync legacy fields when switching content type
    const updates: Partial<Option> = {
      content: newContent,
      text: newContent.text || "",
      text_sl: newContent.text_sl || "",
      text_hr: newContent.text_hr || "",
    };

    updateOption(optionIndex, updates);
  };

  const updateOptionContent = (optionIndex: number, field: string, value: string) => {
    const option = question.options[optionIndex];
    if (!option.content) return;

    const newContent = { ...option.content, [field]: value };

    // IMPORTANT: Also update legacy text fields for backward compatibility
    // This ensures validation passes which checks BOTH content AND legacy fields
    const updates: Partial<Option> = {
      content: newContent as OptionContent
    };

    // Sync content text fields to legacy fields
    if (field === "text" || field === "text_sl" || field === "text_hr") {
      updates[field] = value;
    }

    updateOption(optionIndex, updates);
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
          const contentType = getOptionContentType(option);

          // IMPORTANT: Initialize content object if missing (for legacy or newly created options)
          if (!option.content) {
            // Auto-fix: Create content object from legacy fields
            const initialContent = {
              type: "text" as const,
              text: option.text || "",
              text_sl: option.text_sl || "",
              text_hr: option.text_hr || "",
            };
            // Update the option with content object
            setTimeout(() => {
              updateOption(optionIndex, { content: initialContent });
            }, 0);
          }

          // Get current text value based on content type and language
          let currentText = "";

          if (option.content) {
            if (option.content.type === "text" || option.content.type === "mixed") {
              if (textFieldName === "text") currentText = option.content.text || "";
              else if (textFieldName === "text_sl") currentText = option.content.text_sl || "";
              else if (textFieldName === "text_hr") currentText = option.content.text_hr || "";
            }
          } else {
            // Legacy option without content object - fallback to legacy fields
            if (textFieldName === "text") currentText = option.text || "";
            else if (textFieldName === "text_sl") currentText = option.text_sl || "";
            else if (textFieldName === "text_hr") currentText = option.text_hr || "";
          }

          return (
            <Card key={option.id || optionIndex} className="border-dashed">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Correct option selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        key={`${option.id}-${option.isCorrect}`}
                        type={question.questionType === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                        name={question.questionType === "SINGLE_CHOICE" ? "correct-option" : undefined}
                        checked={option.isCorrect}
                        onChange={(e) => updateOption(optionIndex, { isCorrect: e.target.checked })}
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

                  {/* Content Type Selector */}
                  <div>
                    <Label className="text-sm mb-2 block">Content Type</Label>
                    <Tabs
                      value={contentType}
                      onValueChange={(value) =>
                        switchContentType(optionIndex, value as "text" | "mixed")
                      }
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text">Text Only</TabsTrigger>
                        <TabsTrigger value="mixed">Text + Image</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Content Fields based on type */}
                  <div className="space-y-3">
                    {contentType === "text" && (
                      <div>
                        <Label className="text-sm">
                          Option Text ({language.toUpperCase()})
                        </Label>
                        <Input
                          value={currentText}
                          onChange={(e) => updateOptionContent(optionIndex, textFieldName, e.target.value)}
                          placeholder={getPlaceholder(optionIndex, language)}
                          className={cn(
                            option.isCorrect && "border-green-300 bg-green-50"
                          )}
                        />
                      </div>
                    )}

                    {contentType === "mixed" && option.content && option.content.type === "mixed" && (
                      <>
                        <div>
                          <Label className="text-sm">
                            Option Text ({language.toUpperCase()})
                          </Label>
                          <Input
                            value={currentText}
                            onChange={(e) => updateOptionContent(optionIndex, textFieldName, e.target.value)}
                            placeholder={getPlaceholder(optionIndex, language)}
                            className={cn(
                              option.isCorrect && "border-green-300 bg-green-50"
                            )}
                          />
                        </div>

                        <OptionImageUploader
                          imageUrl={option.content.imageUrl}
                          language={language}
                          onImageUpload={(url) => updateOptionContent(optionIndex, "imageUrl", url)}
                          onImageRemove={() => updateOptionContent(optionIndex, "imageUrl", "")}
                        />
                      </>
                    )}
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

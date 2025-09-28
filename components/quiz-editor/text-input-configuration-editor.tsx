"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Question, TextInputConfiguration } from "./quiz-editor-layout";
import { Language } from "./quiz-editor-provider";

interface TextInputConfigurationEditorProps {
  question: Question;
  language: Language;
  onChange: (field: string, value: TextInputConfiguration) => void;
}

export function TextInputConfigurationEditor({
  question,
  language,
  onChange
}: TextInputConfigurationEditorProps) {
  const textInputData = question.textInputData || {
    acceptableAnswers: [""],
    caseSensitive: false,
    placeholder: "",
    placeholder_sl: "",
    placeholder_hr: ""
  };

  const getPlaceholderFieldName = () => {
    if (language === "sl") return "placeholder_sl";
    if (language === "hr") return "placeholder_hr";
    return "placeholder";
  };

  const getPlaceholderForInput = () => {
    return "Acceptable answer text";
  };

  const updateConfiguration = (updates: Partial<TextInputConfiguration>) => {
    const newConfiguration = { ...textInputData, ...updates };
    onChange("textInputData", newConfiguration);
  };

  const addAcceptableAnswer = () => {
    const newAnswers = [...textInputData.acceptableAnswers, ""];
    updateConfiguration({ acceptableAnswers: newAnswers });
  };

  const removeAcceptableAnswer = (index: number) => {
    if (textInputData.acceptableAnswers.length <= 1) return;
    const newAnswers = textInputData.acceptableAnswers.filter((_, i) => i !== index);
    updateConfiguration({ acceptableAnswers: newAnswers });
  };

  const updateAcceptableAnswer = (index: number, value: string) => {
    const newAnswers = [...textInputData.acceptableAnswers];
    newAnswers[index] = value;
    updateConfiguration({ acceptableAnswers: newAnswers });
  };

  const updatePlaceholder = (value: string) => {
    const placeholderField = getPlaceholderFieldName();
    updateConfiguration({ [placeholderField]: value });
  };

  const getCurrentPlaceholder = () => {
    const placeholderField = getPlaceholderFieldName();
    return textInputData[placeholderField as keyof TextInputConfiguration] as string || "";
  };

  return (
    <div className="space-y-6">
        {/* Text Input Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Text Input Settings</CardTitle>
            <CardDescription>
              Configure validation rules for this text input question
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Case Sensitivity */}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={textInputData.caseSensitive}
                onCheckedChange={(checked) =>
                  updateConfiguration({ caseSensitive: !!checked })
                }
              />
              <div className="space-y-1 leading-none">
                <Label className="cursor-pointer">Case Sensitive</Label>
                <p className="text-sm text-muted-foreground">
                  Answers must match exact capitalization
                </p>
              </div>
            </div>

            {/* Placeholder Text */}
            <div className="space-y-2">
              <Label>Placeholder Text ({language.toUpperCase()})</Label>
              <Input
                value={getCurrentPlaceholder()}
                onChange={(e) => updatePlaceholder(e.target.value)}
                placeholder={`Optional placeholder text for students in ${language.toUpperCase()}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Acceptable Answers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Acceptable Answers</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Add all acceptable answers for this question. Students only need to match one of these answers.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAcceptableAnswer}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Answer
            </Button>
          </div>

          <div className="space-y-3">
            {textInputData.acceptableAnswers.map((answer, index) => (
              <Card key={index} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Label>Answer {index + 1}</Label>
                      <Input
                        value={answer}
                        onChange={(e) => updateAcceptableAnswer(index, e.target.value)}
                        placeholder={getPlaceholderForInput()}
                        className="mt-1"
                      />
                    </div>

                    {textInputData.acceptableAnswers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive self-end"
                        onClick={() => removeAcceptableAnswer(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </div>
  );
}
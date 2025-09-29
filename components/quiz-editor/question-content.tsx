"use client";

import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Question, Option, TextInputConfiguration, DropdownConfiguration } from "./quiz-editor-layout";
import { Language } from "./quiz-editor-provider";

interface QuestionContentProps {
  question: Question;
  language: Language;
  onChange: (field: string, value: string | Option[] | TextInputConfiguration | DropdownConfiguration) => void;
}

export function QuestionContent({
  question,
  language,
  onChange
}: QuestionContentProps) {
  const getTextFieldName = (baseField: string): keyof Question => {
    if (language === "sl") return `${baseField}_sl` as keyof Question;
    if (language === "hr") return `${baseField}_hr` as keyof Question;
    return baseField as keyof Question;
  };

  const getPlaceholder = (language: Language) => {
    switch (language) {
      case "sl":
        return "Vnesi besedilo vprašanja v slovenščini";
      case "hr":
        return "Unesite tekst pitanja na hrvatskom";
      default:
        return "Enter question text in English";
    }
  };

  const currentText = question[getTextFieldName("text")] as string || "";

  return (
    <div className="space-y-6">
      {/* Question Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900">
          Question Type
        </label>
        <Select
          value={question.questionType}
          onValueChange={(value) => {

            onChange("questionType", value);
            // Clear options for TEXT_INPUT questions and set default textInputData
            if (value === "TEXT_INPUT") {
              const defaultTextInputData = {
                acceptableAnswers: [""],
                caseSensitive: false,
                placeholder: "",
                placeholder_sl: "",
                placeholder_hr: ""
              };

              onChange("options", []);
              onChange("textInputData", defaultTextInputData);
            }

            // Clear options for DROPDOWN questions and set default dropdownData
            if (value === "DROPDOWN") {
              const defaultDropdownData = {
                template: "",
                template_sl: "",
                template_hr: "",
                dropdowns: [],
                scoring: {
                  pointsPerDropdown: 1,
                  requireAllCorrect: true,
                  penalizeIncorrect: false
                }
              };

              onChange("options", []);
              onChange("dropdownData", defaultDropdownData);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SINGLE_CHOICE">Single Choice (Radio Buttons)</SelectItem>
            <SelectItem value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</SelectItem>
            <SelectItem value="TEXT_INPUT">Text Input</SelectItem>
            <SelectItem value="DROPDOWN">Dropdown Selection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Question Text */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900">
          Question Text ({language.toUpperCase()})
        </label>
        <Textarea
          value={currentText}
          onChange={(e) => {
            const fieldName = getTextFieldName("text");
            const newValue = e.target.value;

            onChange(fieldName, newValue);
          }}
          placeholder={getPlaceholder(language)}
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  );
}
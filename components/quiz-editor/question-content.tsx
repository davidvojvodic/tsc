"use client";

import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Question, Option, TextInputConfiguration, DropdownConfiguration, OrderingConfiguration, MatchingConfiguration } from "./quiz-editor-layout";
import { Language } from "./quiz-editor-provider";
import { QuestionImageUploader } from "./question-image-uploader";

interface QuestionContentProps {
  question: Question;
  language: Language;
  onChange: (field: string, value: string | Option[] | TextInputConfiguration | DropdownConfiguration | OrderingConfiguration | MatchingConfiguration) => void;
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

            // Clear options for ORDERING questions and set default orderingData
            if (value === "ORDERING") {
              const defaultOrderingData: OrderingConfiguration = {
                instructions: "Arrange the following items in the correct order:",
                instructions_sl: "",
                instructions_hr: "",
                items: [],
                allowPartialCredit: false,
                exactOrderRequired: true
              };

              onChange("options", []);
              onChange("orderingData", defaultOrderingData);
            }

            // Clear options for MATCHING questions and set default matchingData
            if (value === "MATCHING") {
              const defaultMatchingData: MatchingConfiguration = {
                instructions: "Match the items on the left with the corresponding items on the right:",
                instructions_sl: "",
                instructions_hr: "",
                matchingType: "one-to-one",
                leftItems: [],
                rightItems: [],
                correctMatches: [],
                distractors: [],
                scoring: {
                  pointsPerMatch: 1,
                  penalizeIncorrect: false,
                  penaltyPerIncorrect: 0,
                  requireAllMatches: true,
                  partialCredit: false,
                },
                display: {
                  connectionStyle: "line",
                  connectionColor: "#3b82f6",
                  correctColor: "#10b981",
                  incorrectColor: "#ef4444",
                  showConnectionLabels: false,
                  animateConnections: true,
                }
              };

              onChange("options", []);
              onChange("matchingData", defaultMatchingData);
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
            <SelectItem value="ORDERING">Ordering / Sequencing</SelectItem>
            <SelectItem value="MATCHING">Matching / Connecting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Question Text */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-900">
          Question Text ({language.toUpperCase()})
          {question.questionType === "TEXT_INPUT" && (
            <span className="text-muted-foreground font-normal ml-2">
              (Optional if image is provided)
            </span>
          )}
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

      {/* Image Upload (only shown for TEXT_INPUT and only in EN language) */}
      {question.questionType === "TEXT_INPUT" && language === "en" && (
        <QuestionImageUploader
          imageUrl={question.imageUrl}
          onImageUpload={(url) => onChange("imageUrl", url)}
          onImageRemove={() => onChange("imageUrl", "")}
        />
      )}

      {/* Ordering Instructions (only shown for ORDERING question type) */}
      {question.questionType === "ORDERING" && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-900">
            Ordering Instructions ({language.toUpperCase()})
          </label>
          <Textarea
            value={
              language === "sl"
                ? question.orderingData?.instructions_sl || ""
                : language === "hr"
                ? question.orderingData?.instructions_hr || ""
                : question.orderingData?.instructions || ""
            }
            onChange={(e) => {
              const currentOrderingData = question.orderingData || {
                instructions: "",
                instructions_sl: "",
                instructions_hr: "",
                items: [],
                allowPartialCredit: false,
                exactOrderRequired: true,
              };

              const instructionsField =
                language === "sl"
                  ? "instructions_sl"
                  : language === "hr"
                  ? "instructions_hr"
                  : "instructions";

              onChange("orderingData", {
                ...currentOrderingData,
                [instructionsField]: e.target.value,
              });
            }}
            placeholder={
              language === "sl"
                ? "Razporedi naslednje elemente v pravilnem vrstnem redu:"
                : language === "hr"
                ? "Poredaj sljedeće stavke u pravilnom redoslijedu:"
                : "Arrange the following items in the correct order:"
            }
            className="min-h-[80px] resize-none"
          />
        </div>
      )}
    </div>
  );
}
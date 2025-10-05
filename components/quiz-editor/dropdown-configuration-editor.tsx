"use client";

import { Plus, Trash2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Language } from "./quiz-editor-provider";

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

interface Question {
  dropdownData?: DropdownConfiguration;
}

interface DropdownConfigurationEditorProps {
  question: Question;
  language: Language;
  onChange: (field: string, value: DropdownConfiguration) => void;
}

export function DropdownConfigurationEditor({
  question,
  language,
  onChange
}: DropdownConfigurationEditorProps) {
  const dropdownData = question.dropdownData || {
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

  const getTemplateFieldName = () => {
    if (language === "sl") return "template_sl";
    if (language === "hr") return "template_hr";
    return "template";
  };

  const updateConfiguration = (updates: Partial<DropdownConfiguration>) => {
    const newConfiguration = { ...dropdownData, ...updates };
    onChange("dropdownData", newConfiguration);
  };

  const updateTemplate = (value: string) => {
    const templateField = getTemplateFieldName();
    updateConfiguration({ [templateField]: value });
  };

  const getCurrentTemplate = () => {
    const templateField = getTemplateFieldName();
    return dropdownData[templateField as keyof DropdownConfiguration] as string || "";
  };

  const addDropdown = () => {
    const newId = `dropdown${dropdownData.dropdowns.length + 1}`;
    const newDropdown: DropdownField = {
      id: newId,
      label: `Dropdown ${dropdownData.dropdowns.length + 1}`,
      label_sl: "",
      label_hr: "",
      options: [
        { id: `${newId}_opt1`, text: "Option 1", text_sl: "", text_hr: "", isCorrect: true },
        { id: `${newId}_opt2`, text: "Option 2", text_sl: "", text_hr: "", isCorrect: false },
      ]
    };
    updateConfiguration({
      dropdowns: [...dropdownData.dropdowns, newDropdown]
    });
  };

  const removeDropdown = (index: number) => {
    const newDropdowns = dropdownData.dropdowns.filter((_, i) => i !== index);
    updateConfiguration({ dropdowns: newDropdowns });
  };

  const updateDropdown = (index: number, updates: Partial<DropdownField>) => {
    const newDropdowns = [...dropdownData.dropdowns];
    newDropdowns[index] = { ...newDropdowns[index], ...updates };
    updateConfiguration({ dropdowns: newDropdowns });
  };

  const addOption = (dropdownIndex: number) => {
    const dropdown = dropdownData.dropdowns[dropdownIndex];
    const newOptionId = `${dropdown.id}_opt${dropdown.options.length + 1}`;
    const newOption: DropdownOption = {
      id: newOptionId,
      text: `Option ${dropdown.options.length + 1}`,
      text_sl: "",
      text_hr: "",
      isCorrect: false
    };
    updateDropdown(dropdownIndex, {
      options: [...dropdown.options, newOption]
    });
  };

  const removeOption = (dropdownIndex: number, optionIndex: number) => {
    const dropdown = dropdownData.dropdowns[dropdownIndex];
    if (dropdown.options.length <= 2) return; // Minimum 2 options
    const newOptions = dropdown.options.filter((_, i) => i !== optionIndex);
    updateDropdown(dropdownIndex, { options: newOptions });
  };

  const updateOption = (dropdownIndex: number, optionIndex: number, updates: Partial<DropdownOption>) => {
    const dropdown = dropdownData.dropdowns[dropdownIndex];
    const newOptions = [...dropdown.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
    updateDropdown(dropdownIndex, { options: newOptions });
  };

  return (
    <div className="space-y-6">
      {/* Template Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question Template</CardTitle>
          <CardDescription>
            Use {`{dropdownId}`} placeholders where dropdowns should appear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Template Text ({language.toUpperCase()})</Label>
            <Textarea
              value={getCurrentTemplate()}
              onChange={(e) => updateTemplate(e.target.value)}
              placeholder="The capital of France is {dropdown1} and it has {dropdown2} million people."
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Example: &quot;The capital of France is {`{dropdown1}`} and it has {`{dropdown2}`} million people.&quot;
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dropdowns */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Dropdowns</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Add dropdowns that will appear in the template text
            </p>
          </div>
          <Button type="button" onClick={addDropdown} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Dropdown
          </Button>
        </div>

        {dropdownData.dropdowns.map((dropdown, dropdownIndex) => (
          <DropdownFieldEditor
            key={dropdown.id}
            dropdown={dropdown}
            language={language}
            onUpdate={(updates) => updateDropdown(dropdownIndex, updates)}
            onRemove={() => removeDropdown(dropdownIndex)}
            onAddOption={() => addOption(dropdownIndex)}
            onRemoveOption={(optionIndex) => removeOption(dropdownIndex, optionIndex)}
            onUpdateOption={(optionIndex, updates) => updateOption(dropdownIndex, optionIndex, updates)}
            canRemove={dropdownData.dropdowns.length > 1}
          />
        ))}

        {dropdownData.dropdowns.length === 0 && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              Add at least one dropdown to create a fill-in-the-blank question.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Scoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Points per Dropdown</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={dropdownData.scoring?.pointsPerDropdown || 1}
              onChange={(e) => updateConfiguration({
                scoring: {
                  pointsPerDropdown: parseFloat(e.target.value) || 1,
                  requireAllCorrect: dropdownData.scoring?.requireAllCorrect ?? true,
                  penalizeIncorrect: dropdownData.scoring?.penalizeIncorrect ?? false
                }
              })}
            />
          </div>

          <Label className="text-sm font-medium">Scoring Method</Label>
          <RadioGroup
            value={dropdownData.scoring?.requireAllCorrect ?? true ? "ALL_OR_NOTHING" : "PARTIAL_CREDIT"}
            onValueChange={(value) => updateConfiguration({
              scoring: {
                pointsPerDropdown: 1,
                requireAllCorrect: value === "ALL_OR_NOTHING",
                penalizeIncorrect: false
              }
            })}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="ALL_OR_NOTHING" id="dropdown-all-or-nothing" />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="dropdown-all-or-nothing"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  All or Nothing
                </Label>
                <p className="text-xs text-muted-foreground">
                  All dropdowns must be correct to earn points
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="PARTIAL_CREDIT" id="dropdown-partial-credit" />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="dropdown-partial-credit"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Partial Credit
                </Label>
                <p className="text-xs text-muted-foreground">
                  Award points for each correct dropdown selection
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual dropdown field editor component
function DropdownFieldEditor({
  dropdown,
  language,
  onUpdate,
  onRemove,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  canRemove
}: {
  dropdown: DropdownField;
  language: Language;
  onUpdate: (updates: Partial<DropdownField>) => void;
  onRemove: () => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  onUpdateOption: (optionIndex: number, updates: Partial<DropdownOption>) => void;
  canRemove: boolean;
}) {
  const getLabelFieldName = () => {
    if (language === "sl") return "label_sl";
    if (language === "hr") return "label_hr";
    return "label";
  };

  const getTextFieldName = () => {
    if (language === "sl") return "text_sl";
    if (language === "hr") return "text_hr";
    return "text";
  };

  const getCurrentLabel = () => {
    const labelField = getLabelFieldName();
    return dropdown[labelField as keyof DropdownField] as string || "";
  };

  const updateLabel = (value: string) => {
    const labelField = getLabelFieldName();
    onUpdate({ [labelField]: value });
  };

  const updateOptionText = (optionIndex: number, value: string) => {
    const textField = getTextFieldName();
    onUpdateOption(optionIndex, { [textField]: value });
  };

  const getCurrentOptionText = (option: DropdownOption) => {
    const textField = getTextFieldName();
    return option[textField as keyof DropdownOption] as string || "";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              {dropdown.id}
            </Badge>
            <span className="text-sm text-muted-foreground">Use {`{${dropdown.id}}`} in template</span>
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dropdown Label */}
        <div className="space-y-2">
          <Label>Label ({language.toUpperCase()})</Label>
          <Input
            value={getCurrentLabel()}
            onChange={(e) => updateLabel(e.target.value)}
            placeholder="Select option..."
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Options</Label>
            <Button type="button" onClick={onAddOption} size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>

          {dropdown.options.map((option, optionIndex) => (
            <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
              <Input
                value={getCurrentOptionText(option)}
                onChange={(e) => updateOptionText(optionIndex, e.target.value)}
                placeholder="Option text"
                className="flex-1"
              />

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={option.isCorrect}
                  onCheckedChange={(checked) => onUpdateOption(optionIndex, { isCorrect: !!checked })}
                />
                <Label className="text-xs">Correct</Label>
              </div>

              {dropdown.options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveOption(optionIndex)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
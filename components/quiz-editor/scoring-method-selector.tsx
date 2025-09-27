"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ScoringMethodSelectorProps {
  value: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
  onChange: (method: "ALL_OR_NOTHING" | "PARTIAL_CREDIT") => void;
}

export function ScoringMethodSelector({ value, onChange }: ScoringMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Scoring Method</Label>
      <RadioGroup
        value={value}
        onValueChange={(newValue) => onChange(newValue as "ALL_OR_NOTHING" | "PARTIAL_CREDIT")}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="ALL_OR_NOTHING" id="all-or-nothing" />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="all-or-nothing"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              All or Nothing
            </Label>
            <p className="text-xs text-muted-foreground">
              Students must select all correct answers to earn points
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="PARTIAL_CREDIT" id="partial-credit" />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="partial-credit"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Partial Credit
            </Label>
            <p className="text-xs text-muted-foreground">
              Students earn points for each correct answer selected
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/image-with-fallback";

// Dropdown option interface supporting TEXT and MIXED content types
export interface ImageDropdownOption {
  id: string;
  content?: {
    type: "text" | "mixed";
    text?: string;
    text_sl?: string;
    text_hr?: string;
    imageUrl?: string;
  };
  // Legacy text fields for backward compatibility
  text?: string;
  text_sl?: string;
  text_hr?: string;
  isCorrect?: boolean;
}

export interface ImageDropdownProps {
  options: ImageDropdownOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "success" | "error";
  language?: "en" | "sl" | "hr";
}

// Helper to get localized text from option
function getLocalizedText(
  option: ImageDropdownOption,
  language: "en" | "sl" | "hr" = "en"
): string {
  // Prefer new content system
  if (option.content) {
    const { text, text_sl, text_hr } = option.content;
    if (language === "sl" && text_sl) return text_sl;
    if (language === "hr" && text_hr) return text_hr;
    return text || "";
  }

  // Fall back to legacy text fields
  if (language === "sl" && option.text_sl) return option.text_sl;
  if (language === "hr" && option.text_hr) return option.text_hr;
  return option.text || "";
}

// OptionDisplay subcomponent - renders option content based on type
interface OptionDisplayProps {
  option: ImageDropdownOption;
  language?: "en" | "sl" | "hr";
  compact?: boolean;
}

function OptionDisplay({ option, language = "en", compact = false }: OptionDisplayProps) {
  const text = getLocalizedText(option, language);
  const imageSize = compact ? 24 : 48;
  const imageClass = compact ? "h-6 w-6" : "h-12 w-12";

  // MIXED type: show image + text
  if (option.content?.type === "mixed" && option.content.imageUrl) {
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={cn(imageClass, "relative flex-shrink-0 rounded overflow-hidden")}>
          <ImageWithFallback
            src={option.content.imageUrl}
            alt={text || "Option image"}
            width={imageSize}
            height={imageSize}
            className="object-cover"
          />
        </div>
        {text && (
          <span className="flex-1 truncate text-sm">{text}</span>
        )}
      </div>
    );
  }

  // TEXT type: show text only
  return (
    <span className="flex-1 truncate text-sm">
      {text || "Untitled option"}
    </span>
  );
}

// Main ImageDropdown component
export const ImageDropdown = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  ImageDropdownProps
>(({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  className,
  variant = "default",
  language = "en"
}, ref) => {
  const selectedOption = options.find(opt => opt.id === value);

  const variantStyles = {
    default: "border-input bg-background",
    success: "border-green-500 bg-green-50 dark:bg-green-950",
    error: "border-red-500 bg-red-50 dark:bg-red-950"
  };

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      {/* Trigger Button */}
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "inline-flex items-center justify-between",
          "min-w-[180px] h-10 px-3 py-2",
          "text-sm font-medium",
          "border rounded-md",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          "data-[placeholder]:text-muted-foreground",
          variantStyles[variant],
          className
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <OptionDisplay option={selectedOption} language={language} compact />
          ) : (
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          )}
        </div>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      {/* Dropdown Content Portal */}
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 min-w-[200px] max-w-[400px] max-h-[300px]",
            "overflow-hidden",
            "rounded-md border bg-popover text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2"
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-1 max-h-[300px] overflow-y-auto">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.id}
                value={option.id}
                className={cn(
                  "relative flex items-center gap-2",
                  "w-full px-2 py-2 pr-8",
                  "text-sm outline-none cursor-pointer",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  "rounded-sm transition-colors"
                )}
              >
                <OptionDisplay option={option} language={language} />

                {/* Checkmark for selected item */}
                <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});

ImageDropdown.displayName = "ImageDropdown";

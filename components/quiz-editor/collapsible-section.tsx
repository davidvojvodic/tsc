"use client";

import { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  isExpanded,
  onToggle,
  className
}: CollapsibleSectionProps) {
  return (
    <div className={cn("border border-gray-200 rounded-lg", className)}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onToggle(!isExpanded)}
        className="w-full justify-between p-4 h-auto text-left font-medium"
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-gray-200 pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
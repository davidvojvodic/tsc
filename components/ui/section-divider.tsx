"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const sectionDividerVariants = cva(
  "w-full transition-all duration-800 ease-out",
  {
    variants: {
      variant: {
        fluid: "h-0.5 bg-gradient-to-r from-transparent via-primary/15 to-transparent",
        wave: "h-0.5 bg-gradient-to-r from-primary to-primary/80 clip-wave",
        technical: "h-2 border-t border-b border-primary/20 border-primary/10",
        minimal: "h-px bg-primary/10",
      },
      prominence: {
        subtle: "opacity-60",
        moderate: "opacity-80",
        prominent: "opacity-100",
      },
      spacing: {
        compact: "",
        standard: "",
        spacious: "",
      },
    },
    defaultVariants: {
      variant: "fluid",
      prominence: "moderate",
      spacing: "standard",
    },
  }
);

export interface SectionDividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sectionDividerVariants> {
  animate?: boolean;
}

export function SectionDivider({
  className,
  variant = "fluid",
  prominence = "moderate",
  spacing = "standard",
  animate = true,
  ...props
}: SectionDividerProps) {
  return (
    <div
      className={cn(
        sectionDividerVariants({ variant, prominence, spacing }),
        animate && "animate-in slide-in-from-left-full duration-800",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
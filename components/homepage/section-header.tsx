"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Waves, Droplets } from "lucide-react";

interface SectionHeaderProps {
  icon?: ReactNode;
  title: {
    en: string;
    sl: string;
    hr: string;
  };
  subtitle: {
    en: string;
    sl: string;
    hr: string;
  };
  description?: {
    en: string;
    sl: string;
    hr: string;
  };
  locale?: "en" | "sl" | "hr";
  className?: string;
  variant?: "default" | "compact";
  statusIndicator?: {
    type: "live" | "demo" | "offline";
    text: {
      en: string;
      sl: string;
      hr: string;
    };
  };
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  description,
  locale = "en",
  className,
  variant = "default",
  statusIndicator,
}: SectionHeaderProps) {
  const getStatusColor = (type: "live" | "demo" | "offline") => {
    switch (type) {
      case "live":
        return "bg-green-500 text-white";
      case "demo":
        return "bg-blue-500 text-white";
      case "offline":
        return "bg-gray-500 text-white";
    }
  };

  const getStatusPulse = (type: "live" | "demo" | "offline") => {
    switch (type) {
      case "live":
        return "after:bg-green-400";
      case "demo":
        return "after:bg-blue-400";
      case "offline":
        return "";
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Water-themed background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-400/10 to-blue-400/10 rounded-full blur-3xl transform -translate-x-24 translate-y-24" />

        {/* Floating water droplets */}
        <Droplets className="absolute top-8 left-8 w-6 h-6 text-blue-300/30 dark:text-blue-600/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Waves className="absolute top-16 right-16 w-8 h-8 text-cyan-300/30 dark:text-cyan-600/30 animate-pulse" style={{ animationDelay: '1s' }} />
        <Droplets className="absolute bottom-16 right-24 w-5 h-5 text-teal-300/30 dark:text-teal-600/30 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }} />
      </div>

      <div className="relative z-10">
        {/* Glass-morphism container */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 rounded-2xl p-8 md:p-12 shadow-xl">
          <div className="text-center max-w-4xl mx-auto">
            {/* Icon and Status Indicator Row */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Icon */}
              {icon && (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                  {icon}
                </div>
              )}

              {/* Status Indicator */}
              {statusIndicator && (
                <div className={cn(
                  "relative inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold",
                  getStatusColor(statusIndicator.type),
                  statusIndicator.type === "live" && "relative",
                  statusIndicator.type === "live" && "after:absolute after:top-0 after:right-0 after:w-3 after:h-3 after:bg-green-400 after:rounded-full after:animate-ping",
                  statusIndicator.type === "live" && "before:absolute before:top-0 before:right-0 before:w-3 before:h-3 before:bg-green-500 before:rounded-full"
                )}>
                  {statusIndicator.text[locale]}
                </div>
              )}
            </div>

            {/* Title */}
            <h2 className={cn(
              "font-bold mb-4",
              variant === "compact" ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl lg:text-5xl"
            )}>
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                {title[locale]}
              </span>
            </h2>

            {/* Subtitle */}
            <h3 className={cn(
              "font-semibold text-primary mb-4",
              variant === "compact" ? "text-lg md:text-xl" : "text-xl md:text-2xl"
            )}>
              {subtitle[locale]}
            </h3>

            {/* Description */}
            {description && (
              <p className={cn(
                "text-muted-foreground leading-relaxed",
                variant === "compact" ? "text-base max-w-2xl mx-auto" : "text-lg max-w-3xl mx-auto"
              )}>
                {description[locale]}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
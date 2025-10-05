"use client";

import { cn } from "@/lib/utils";
import { QuestionCompletionStatus } from "./question-list-item";
import { CheckCircle, AlertCircle, Circle, XCircle } from "lucide-react";

interface StatusIndicatorProps {
  status: QuestionCompletionStatus;
  className?: string;
  tooltip?: string;
  showIcon?: boolean;
}

export function StatusIndicator({ status, className, tooltip, showIcon = false }: StatusIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "partial":
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getDefaultTooltip = () => {
    switch (status) {
      case "complete":
        return "Question is complete";
      case "partial":
        return "Question is partially complete";
      case "error":
        return "Question has errors";
      default:
        return "Question is incomplete";
    }
  };

  if (showIcon) {
    return (
      <div
        className={cn("flex-shrink-0", className)}
        title={tooltip || getDefaultTooltip()}
      >
        {getIcon()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-3 h-3 rounded-full flex-shrink-0",
        {
          "bg-green-500": status === "complete",
          "bg-yellow-500": status === "partial",
          "bg-gray-400": status === "incomplete",
          "bg-red-500": status === "error",
        },
        className
      )}
      title={tooltip || getDefaultTooltip()}
    />
  );
}
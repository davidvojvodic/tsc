"use client";

import { AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GroupedValidationErrors, formatErrorPath, getValidationSummary } from "@/lib/validation-utils";

interface ValidationErrorPanelProps {
  errors: GroupedValidationErrors | null;
  onClose?: () => void;
  onErrorClick?: (questionIndex: number) => void;
}

export function ValidationErrorPanel({ errors, onClose, onErrorClick }: ValidationErrorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!errors || !errors.hasErrors) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mx-6 mt-4 mb-0">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>Validation Errors</span>
          <Badge variant="destructive" className="ml-2">
            {errors.totalErrorCount}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0 hover:bg-red-100"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertTitle>

      {isExpanded && (
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm font-medium">{getValidationSummary(errors)}</p>

          {/* Quiz-level errors */}
          {errors.quizErrors.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Quiz Details:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.quizErrors.map((error, index) => (
                  <li key={index}>
                    <span className="font-medium">{formatErrorPath(error.path)}:</span>{" "}
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Question-level errors */}
          {errors.questionErrors.size > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Question Errors:</h4>
              {Array.from(errors.questionErrors.entries())
                .sort(([a], [b]) => a - b) // Sort by question index
                .map(([questionIndex, questionErrors]) => (
                  <div
                    key={questionIndex}
                    className="border-l-2 border-red-300 pl-3 space-y-1 hover:bg-red-50 cursor-pointer rounded py-1 -ml-1"
                    onClick={() => onErrorClick?.(questionIndex)}
                  >
                    <h5 className="text-sm font-semibold flex items-center gap-2">
                      Question {questionIndex + 1}
                      <Badge variant="outline" className="text-xs">
                        {questionErrors.length} error{questionErrors.length > 1 ? "s" : ""}
                      </Badge>
                    </h5>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {questionErrors.map((error, index) => (
                        <li key={index} className="text-red-800">
                          <span className="font-medium">
                            {formatErrorPath(error.path.slice(2))}:
                          </span>{" "}
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}

          <p className="text-xs mt-3 text-red-800 font-medium">
            Please fix all validation errors before saving the quiz.
          </p>
        </AlertDescription>
      )}
    </Alert>
  );
}

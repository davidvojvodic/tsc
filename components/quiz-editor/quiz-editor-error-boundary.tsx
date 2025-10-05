"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface QuizEditorErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface QuizEditorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class QuizEditorErrorBoundary extends React.Component<
  QuizEditorErrorBoundaryProps,
  QuizEditorErrorBoundaryState
> {
  constructor(props: QuizEditorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): QuizEditorErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Quiz Editor Error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Report to monitoring service if available
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: error.message,
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-red-600">Editor Error</CardTitle>
              <CardDescription>
                Something went wrong with the quiz editor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline">
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
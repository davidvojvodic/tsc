"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ResetPasswordForm from "./reset-password-form";

interface ResetPasswordPageProps {
  language: string;
}

export default function ResetPasswordPage({ language }: ResetPasswordPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm language={language} />
    </Suspense>
  );
}
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Home page error:", error);
    console.error("Error digest:", error.digest);
  }, [error]);

  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || "An error occurred while loading the home page."}
        </p>
        {error.digest && (
          <p className="text-sm text-muted-foreground mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => reset()}>Try again</Button>
          <Button
            variant="outline"
            onClick={() => router.refresh()}
          >
            Refresh page
          </Button>
        </div>
      </div>
    </div>
  );
}
// app/admin/materials/[id]/error.tsx
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
    console.error(error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="w-full max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground mb-6">
            {error.message || "An error occurred while loading this page."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => reset()}>Try again</Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/materials")}
            >
              Go back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface StreamProps {
  youtubeIds: {
    mbLocation: string;
    dubrovnikLocation?: string; // Made optional since we only have one camera for now
  };
  isLoading?: boolean;
  error?: string;
}

export default function LiveStreams({
  youtubeIds,
  isLoading = false,
  error,
}: StreamProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden max-w-screen-xl mx-auto rounded-lg bg-muted mb-10">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeIds.mbLocation}?autoplay=1&mute=0`}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}

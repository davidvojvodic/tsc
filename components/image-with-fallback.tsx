"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { ImageOff } from "lucide-react";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  showPlaceholder?: boolean;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  showPlaceholder = true,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (error) {
    if (fallbackSrc && fallbackSrc !== src) {
      // Try fallback image
      return (
        <Image
          {...props}
          src={fallbackSrc}
          alt={alt}
          onError={() => setError(true)}
          onLoad={() => setIsLoading(false)}
        />
      );
    }

    if (showPlaceholder) {
      // Show placeholder
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <ImageOff className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <Image
        {...props}
        src={src}
        alt={alt}
        onError={() => setError(true)}
        onLoad={() => setIsLoading(false)}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <div className="h-8 w-8 rounded-full bg-muted-foreground/20" />
        </div>
      )}
    </>
  );
}

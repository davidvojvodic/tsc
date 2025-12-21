"use client";

import React, { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { X, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface QuestionImageUploaderProps {
  imageUrl: string | null | undefined;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  disabled?: boolean;
}

export function QuestionImageUploader({
  imageUrl,
  onImageUpload,
  onImageRemove,
  disabled = false,
}: QuestionImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {!imageUrl ? (
        <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
          <label className="text-sm font-medium">
            Question Image (Optional)
            <span className="text-muted-foreground font-normal ml-2 text-xs">
              • Shared across all languages
            </span>
          </label>

          {/* Upload Dropzone */}
          <UploadDropzone
            endpoint="questionImageUploader"
            onClientUploadComplete={(res) => {
              if (res && res[0]) {
                onImageUpload(res[0].url);
                setIsUploading(false);
                setUploadError(null);
              }
            }}
            onUploadError={(error: Error) => {
              setUploadError(error.message);
              setIsUploading(false);
            }}
            onUploadBegin={() => {
              setIsUploading(true);
              setUploadError(null);
            }}
            config={{
              mode: "auto",
            }}
            appearance={{
              container: "border-2 border-dashed rounded-lg p-6 transition-colors hover:border-primary",
              uploadIcon: "text-muted-foreground",
              label: "text-sm text-muted-foreground",
              allowedContent: "text-xs text-muted-foreground",
            }}
            content={{
              label: () => (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span>Drag and drop or click to upload</span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG, JPEG, GIF, WebP (max 4MB)
                  </span>
                </div>
              ),
              button: () => isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              ) : "Choose File",
            }}
          />

          {/* Upload Error */}
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Question Image
              <span className="text-muted-foreground font-normal ml-2 text-xs">
                • Shared across all languages
              </span>
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onImageRemove}
              disabled={disabled}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>

          {/* Image Preview */}
          <div className="relative w-full max-w-md rounded-lg border bg-muted overflow-hidden">
            <Image
              src={imageUrl}
              alt="Question image"
              width={600}
              height={400}
              className="w-full h-auto object-contain"
              priority
            />
          </div>

          <p className="text-xs text-muted-foreground">
            This image will be shown to students above the question text
          </p>
        </div>
      )}
    </div>
  );
}

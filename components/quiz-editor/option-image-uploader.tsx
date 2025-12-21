import React, { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Language } from "./quiz-editor-provider";

interface OptionImageUploaderProps {
  imageUrl: string | null | undefined;
  language: Language;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  disabled?: boolean;
}

export function OptionImageUploader({
  imageUrl,
  onImageUpload,
  onImageRemove,
  disabled = false,
}: OptionImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {!imageUrl ? (
        <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
          {/* Upload Button */}
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Image upload">
              <UploadButton
                endpoint="questionImageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) {
                    setIsUploading(false);
                    setUploadError(null);
                    onImageUpload(res[0].url);
                  }
                }}
                onUploadError={(error: Error) => {
                  setIsUploading(false);
                  setUploadError(error.message);
                }}
                onUploadBegin={() => {
                  setIsUploading(true);
                  setUploadError(null);
                }}
                appearance={{
                  button: cn(
                    "ut-ready:bg-primary ut-ready:hover:bg-primary/90",
                    "ut-uploading:bg-primary/50 ut-uploading:cursor-not-allowed",
                    "text-sm px-3 py-2"
                  ),
                  allowedContent: "hidden",
                }}
                content={{
                  button: () =>
                    isUploading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" aria-hidden="true" />
                        <span>Upload Image</span>
                      </div>
                    ),
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground" id="upload-constraints">
              PNG, JPG, GIF, WebP (max 4MB)
            </span>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Image Added Indicator */}
          <div className="flex items-center justify-between p-3 rounded-md border border-green-200 bg-green-50">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
              <span className="text-sm font-medium text-green-700">Image added</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onImageRemove}
              disabled={disabled}
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label="Remove option image"
            >
              <X className="h-3 w-3 mr-1" aria-hidden="true" />
              Remove
            </Button>
          </div>

          {/* Image URL (for debugging/reference) */}
          <p className="text-xs text-muted-foreground truncate" title={imageUrl}>
            {imageUrl}
          </p>
        </div>
      )}
    </div>
  );
}

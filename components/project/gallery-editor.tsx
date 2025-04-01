/* eslint-disable @typescript-eslint/no-explicit-any */
// components/project/gallery-editor.tsx

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { uploadFiles } from "@/lib/uploadthing"; // Ensure this is correctly exported
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ProjectImage } from "@/store/use-project-form";

interface GalleryEditorProps {
  value: ProjectImage[];
  onChange: (gallery: ProjectImage[]) => void;
  isLoading?: boolean;
}

export function GalleryEditor({
  value,
  onChange,
  isLoading = false,
}: GalleryEditorProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Function to handle file selection via react-dropzone
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Optional: Limit the total number of images (e.g., max 10)
      if (value.length + acceptedFiles.length > 10) {
        toast.error("You can upload a maximum of 10 images.");
        return;
      }
      setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [value.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] }, // Adjust as needed
    multiple: true,
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected for upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setTotalFiles(selectedFiles.length);
    setCurrentFileIndex(0);

    try {
      const uploadedImages: ProjectImage[] = [];
      const failedUploads: string[] = [];
      const maxRetries = 2;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentFileIndex(i);
        // Calculate progress percentage based on current file index
        setUploadProgress(Math.round((i / selectedFiles.length) * 100));

        let uploaded = false;
        let retries = 0;

        while (!uploaded && retries < maxRetries) {
          try {
            const res = await uploadFiles("imageUploader", {
              files: [file], // Upload one file at a time
            });

            if (res && res.length > 0) {
              const uploadedFile = res[0];
              const newImage: ProjectImage = {
                id: crypto.randomUUID(),
                url: uploadedFile.ufsUrl || uploadedFile.url,
                fileKey:
                  uploadedFile.key ||
                  (uploadedFile.ufsUrl || uploadedFile.url).split("/").pop() ||
                  crypto.randomUUID(),
                alt: null,
              };
              uploadedImages.push(newImage);
              uploaded = true;
            }
          } catch (error: any) {
            console.error(
              `Failed to upload file ${file.name} (attempt ${retries + 1}):`,
              error
            );
            retries++;

            // Last retry failed
            if (retries >= maxRetries) {
              failedUploads.push(file.name);
            }

            // Small delay before retry
            if (!uploaded && retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
      }

      // Set to 100% when done
      setUploadProgress(100);

      // Handle results
      if (uploadedImages.length > 0) {
        onChange([...value, ...uploadedImages]);
        toast.success(
          `${uploadedImages.length} image(s) uploaded successfully`
        );
      }

      if (failedUploads.length > 0) {
        toast.error(`Failed to upload: ${failedUploads.join(", ")}`);
      }

      setSelectedFiles([]);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(`Upload process error: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Gallery</CardTitle>
        <CardDescription>
          Add and manage images for your project gallery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-6">
            <div
              {...getRootProps()}
              className="w-full h-32 flex flex-col items-center justify-center cursor-pointer"
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the files here ...</p>
              ) : (
                <p>Drag & drop some files here, or click to select files</p>
              )}
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-4 w-full">
                <h4 className="text-sm font-medium">Selected Files:</h4>
                <ul className="list-disc list-inside">
                  {selectedFiles.map((file, index) => (
                    <li key={index}>
                      {file.name} - {(file.size / 1024).toFixed(2)} KB
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || isLoading}
                  className="mt-4"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading {uploadProgress}% - File {currentFileIndex + 1}/
                      {totalFiles}
                    </>
                  ) : (
                    "Upload Selected Images"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Simple Gallery Status Message */}
          <div className="space-y-2">
            {value.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No images uploaded yet. Upload images using the area above.
              </p>
            ) : (
              <div className="border rounded-lg p-4 text-center">
                <h3 className="font-medium">
                  {value.length} {value.length === 1 ? "image" : "images"}{" "}
                  uploaded successfully
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Images will be displayed on the project page after saving.
                </p>

                {/* Hidden button to manage images if needed */}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      toast.info(`Removed all ${value.length} images`);
                      onChange([]);
                    }}
                  >
                    Clear All Images
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

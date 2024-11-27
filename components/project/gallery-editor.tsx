// components/project/gallery-editor.tsx

"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { uploadFiles } from "@/lib/uploadthing"; // Ensure this is correctly exported
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectImage } from "@/store/use-project-form";

const altTextSchema = z.object({
  alt: z.string().max(100, "Alt text cannot exceed 100 characters").nullable(),
});

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
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof altTextSchema>>({
    resolver: zodResolver(altTextSchema),
    defaultValues: {
      alt: null,
    },
  });

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

    try {
      const uploadedImages: ProjectImage[] = [];

      for (const file of selectedFiles) {
        try {
          const res = await uploadFiles("imageUploader", {
            files: [file], // Upload one file at a time
          });

          if (res && res.length > 0) {
            const uploadedFile = res[0];
            const newImage: ProjectImage = {
              id: crypto.randomUUID(),
              url: uploadedFile.url,
              fileKey: uploadedFile.key,
              alt: null,
            };
            uploadedImages.push(newImage);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error(`Failed to upload file ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
      }

      if (uploadedImages.length > 0) {
        onChange([...value, ...uploadedImages]);
        toast.success(
          `${uploadedImages.length} image(s) uploaded successfully`
        );
      }

      setSelectedFiles([]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = (imageId: string) => {
    onChange(value.filter((img) => img.id !== imageId));
    toast.success("Image deleted successfully");
  };

  const handleUpdateAltText = (values: z.infer<typeof altTextSchema>) => {
    if (!selectedImage) return;

    const updatedImages = value.map((img) =>
      img.id === selectedImage.id ? { ...img, alt: values.alt } : img
    );

    onChange(updatedImages);
    toast.success("Image updated successfully");
    setSelectedImage(null);
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
                      Uploading...
                    </>
                  ) : (
                    "Upload Selected Images"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden border"
              >
                <Image
                  src={image.url}
                  alt={image.alt || "Gallery image"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Edit Image Details */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          setSelectedImage(image);
                          form.reset({ alt: image.alt });
                        }}
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleUpdateAltText)}>
                          <DialogHeader>
                            <DialogTitle>Edit Image Details</DialogTitle>
                            <DialogDescription>
                              Update the alternative text for this image
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="relative aspect-video">
                              <Image
                                src={image.url}
                                alt={image.alt || "Gallery image"}
                                fill
                                className="object-cover rounded-lg"
                              />
                            </div>
                            <FormField
                              control={form.control}
                              name="alt"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Alternative Text</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Describe this image"
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) =>
                                        field.onChange(e.target.value || null)
                                      }
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button type="button" variant="outline">
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  {/* Delete Image */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleImageDelete(image.id)}
                    disabled={isLoading}
                    aria-label={`Delete image ${image.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

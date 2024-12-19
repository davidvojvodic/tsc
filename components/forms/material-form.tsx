"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, File, X } from "lucide-react";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadDropzone } from "@/lib/uploadthing";
import { MaterialColumn } from "@/app/admin/materials/components/columns";
import { formatBytes } from "@/lib/utils";

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  published: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
  initialData?: MaterialColumn;
}

export function MaterialForm({ initialData }: MaterialFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<{
    url: string;
    key: string;
    name: string;
    size: number;
  } | null>(
    // Initialize with the existing file data if editing
    initialData
      ? {
          url: initialData.url,
          key: initialData.fileKey,
          name: initialData.filename,
          size: initialData.size,
        }
      : null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      published: initialData?.published ?? true,
    },
  });

  const onRemoveFile = () => {
    setFile(null);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      if (!file && !initialData) {
        toast.error("Please upload a file");
        return;
      }

      const url = initialData?.id
        ? `/api/materials/${initialData.id}`
        : "/api/materials";

      const response = await fetch(url, {
        method: initialData?.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          file,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(
        initialData?.id
          ? "Resource updated successfully"
          : "Resource uploaded successfully"
      );

      router.push("/admin/materials");
      router.refresh();
    } catch (error) {
      console.error("[MATERIAL_FORM_ERROR]", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Resource" : "Upload New Resource"}
        </CardTitle>
        <CardDescription>
          {initialData
            ? "Update your learning resource"
            : "Upload a new learning resource"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormLabel>File</FormLabel>
              {file ? (
                <div className="flex items-center p-4 border rounded-lg bg-muted/50">
                  <File className="h-8 w-8 flex-shrink-0" />
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <UploadDropzone
                    endpoint="materialUploader"
                    config={{ mode: "auto" }}
                    content={{
                      label: "Drop your file here or click to browse",
                      allowedContent:
                        "PDF, Word, Excel, PowerPoint documents up to 32MB",
                    }}
                    appearance={{
                      container: "border-2 border-dashed",
                      allowedContent: "text-xs text-muted-foreground",
                    }}
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setFile({
                          url: res[0].url,
                          key: res[0].key,
                          name: res[0].name,
                          size: res[0].size,
                        });
                        toast.success("File uploaded successfully");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Upload failed: ${error.message}`);
                    }}
                  />
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Enter resource title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isLoading}
                      placeholder="Enter resource description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Enter category"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Published</FormLabel>
                    <FormDescription>
                      This material will be available for download
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/materials")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save changes" : "Upload resource"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

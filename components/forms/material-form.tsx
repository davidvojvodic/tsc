// components/forms/material-form.tsx
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadDropzone } from "@/lib/uploadthing";
import { formatBytes } from "@/lib/utils";
import { Label } from "../ui/label";
import { LanguageTabs, SupportedLanguage, languageOptions } from "../ui/language-tabs";

// Form validation schema
const formSchema = z.object({
  // English fields (required)
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),

  // Slovenian fields (optional)
  title_sl: z.string().optional(),
  description_sl: z.string().optional(),

  // Croatian fields (optional)
  title_hr: z.string().optional(),
  description_hr: z.string().optional(),

  // Common fields
  category: z.string().optional(),
  published: z.boolean().default(true),
  language: z.enum(["en", "sl", "hr"]).default("en"),
});

type FormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
  initialData?: {
    id: string;
    title: string;
    title_sl?: string | null;
    title_hr?: string | null;
    description: string | null;
    description_sl?: string | null;
    description_hr?: string | null;
    category: string | null;
    published: boolean;
    language?: string;
    url: string;
    fileKey: string;
    filename: string;
    size: number;
  };
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
      title_sl: initialData?.title_sl || "",
      title_hr: initialData?.title_hr || "",
      description: initialData?.description || "",
      description_sl: initialData?.description_sl || "",
      description_hr: initialData?.description_hr || "",
      category: initialData?.category || "",
      published: initialData?.published ?? true,
      language: (initialData?.language as "en" | "sl" | "hr") || "en",
    },
  });

  // Helper function to get the field name for a specific language
  const getFieldName = (field: string, lang: SupportedLanguage): string => {
    if (lang === "en") return field;
    return `${field}_${lang}`;
  };

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
                          url: res[0].ufsUrl || res[0].url,
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

            {/* Language selection */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Primary Language</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {languageOptions.map((option) => (
                        <FormItem
                          key={option.id}
                          className="flex items-center space-x-3 space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={option.id} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Select the primary language for this resource
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title with language tabs */}
            <div className="space-y-2">
              <Label>Title</Label>
              <LanguageTabs>
                {(lang) => {
                  const fieldName = getFieldName(
                    "title",
                    lang
                  ) as keyof FormValues;
                  return (
                    <FormField
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              disabled={isLoading}
                              placeholder={`Enter resource title (${lang.toUpperCase()})`}
                              {...field}
                              value={
                                typeof field.value === "boolean"
                                  ? ""
                                  : field.value
                              }
                            />
                          </FormControl>
                          <FormMessage />
                          {lang !== "en" && (
                            <FormDescription>
                              Optional: Enter the title in{" "}
                              {lang === "sl" ? "Slovenian" : "Croatian"}
                            </FormDescription>
                          )}
                        </FormItem>
                      )}
                    />
                  );
                }}
              </LanguageTabs>
            </div>

            {/* Description with language tabs */}
            <div className="space-y-2">
              <Label>Description</Label>
              <LanguageTabs>
                {(lang) => {
                  const fieldName = getFieldName(
                    "description",
                    lang
                  ) as keyof FormValues;
                  return (
                    <FormField
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              disabled={isLoading}
                              placeholder={`Enter resource description (${lang.toUpperCase()})`}
                              {...field}
                              value={
                                typeof field.value === "boolean"
                                  ? ""
                                  : field.value
                              }
                            />
                          </FormControl>
                          <FormMessage />
                          {lang !== "en" && (
                            <FormDescription>
                              Optional: Enter the description in{" "}
                              {lang === "sl" ? "Slovenian" : "Croatian"}
                            </FormDescription>
                          )}
                        </FormItem>
                      )}
                    />
                  );
                }}
              </LanguageTabs>
            </div>

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
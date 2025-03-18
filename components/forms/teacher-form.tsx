// components/forms/teacher-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UploadButton } from "@/lib/uploadthing";
import { Label } from "../ui/label";
import { LanguageTabs, SupportedLanguage } from "../ui/language-tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// Form validation schema
const formSchema = z.object({
  // Core fields (not language specific)
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  email: z.string().email().optional().nullable(),
  displayOrder: z.number().int().default(0),
  school: z.enum(["tsc", "pts"]).optional().nullable(),

  // Multilingual fields
  title: z
    .string()
    .max(100, { message: "Title cannot exceed 100 characters" })
    .optional()
    .nullable(),
  title_sl: z
    .string()
    .max(100, { message: "Title cannot exceed 100 characters" })
    .optional()
    .nullable(),
  title_hr: z
    .string()
    .max(100, { message: "Title cannot exceed 100 characters" })
    .optional()
    .nullable(),
  bio: z.string().optional().nullable(),
  bio_sl: z.string().optional().nullable(),
  bio_hr: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
  initialData?: {
    id: string;
    name: string;
    title: string | null;
    title_sl?: string | null;
    title_hr?: string | null;
    bio: string | null;
    bio_sl?: string | null;
    bio_hr?: string | null;
    email: string | null;
    displayOrder: number;
    school?: string | null;
    photoId: string | null;
    photo?: {
      url: string;
    } | null;
  };
}

export function TeacherForm({ initialData }: TeacherFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<{
    url: string;
    fileKey: string;
    size: number;
    mimeType: string;
  } | null>(
    initialData?.photo
      ? {
          url: initialData.photo.url,
          fileKey: initialData.photoId || "",
          size: 0,
          mimeType: "image/jpeg",
        }
      : null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      title: initialData?.title || "",
      title_sl: initialData?.title_sl || "",
      title_hr: initialData?.title_hr || "",
      bio: initialData?.bio || "",
      bio_sl: initialData?.bio_sl || "",
      bio_hr: initialData?.bio_hr || "",
      email: initialData?.email || null,
      displayOrder: initialData?.displayOrder || 0,
      school: (initialData?.school as "tsc" | "pts") || null,
    },
  });

  // Handle photo removal
  const handleRemovePhoto = () => {
    setPhoto(null);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const url = initialData?.id
        ? `/api/teachers/${initialData.id}`
        : "/api/teachers";

      const response = await fetch(url, {
        method: initialData?.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          photo: photo,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(
        initialData?.id
          ? "Teacher updated successfully"
          : "Teacher created successfully"
      );

      router.push("/admin/teachers");
      router.refresh();
    } catch (error) {
      console.error("[TEACHER_FORM_ERROR]", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get the field name for a specific language
  const getFieldName = (field: string, lang: SupportedLanguage): string => {
    if (lang === "en") return field;
    return `${field}_${lang}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Teacher" : "Create New Teacher"}
        </CardTitle>
        <CardDescription>
          {initialData
            ? "Make changes to the teacher's information below"
            : "Add a new teacher to your platform"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Photo Upload Section */}
        <div className="space-y-4">
          <Label>Photo</Label>
          <div className="flex items-center gap-x-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photo?.url || undefined} />
              <AvatarFallback>{initialData?.name?.[0] || "T"}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <UploadButton
                appearance={{
                  allowedContent: {
                    display: "none",
                  },
                }}
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) {
                    setPhoto({
                      url: res[0].url,
                      fileKey: res[0].key,
                      size: res[0].size,
                      mimeType: res[0].type,
                    });
                    toast.success("Photo uploaded successfully");
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
              />
              {photo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove photo
                </Button>
              )}
            </div>
          </div>
          <Separator />
        </div>

        {/* Form Fields */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Name field (not language specific) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Enter teacher's name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title field with language tabs */}
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
                              placeholder={`e.g. Senior Mathematics Teacher (${lang.toUpperCase()})`}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                          {lang === "en" ? (
                            <FormDescription>
                              Professional title or role within the institution
                            </FormDescription>
                          ) : (
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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      disabled={isLoading}
                      placeholder="Enter contact email"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio field with language tabs */}
            <div className="space-y-2">
              <Label>Bio</Label>
              <LanguageTabs>
                {(lang) => {
                  const fieldName = getFieldName(
                    "bio",
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
                              placeholder={`Enter teacher's bio (${lang.toUpperCase()})`}
                              className="resize-none"
                              rows={5}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                          {lang !== "en" && (
                            <FormDescription>
                              Optional: Enter the bio in{" "}
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
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isLoading}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Controls the order in which teachers are displayed (lower
                    numbers appear first)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="school"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                    defaultValue={field.value || "none"}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="tsc">TSC (Tehniški šolski center)</SelectItem>
                      <SelectItem value="pts">PTS (Poslovno-tehniška šola)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Specify which school the teacher belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/teachers")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save changes" : "Create teacher"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

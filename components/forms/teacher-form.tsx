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

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  title: z
    .string()
    .max(100, { message: "Title cannot exceed 100 characters" })
    .optional()
    .nullable(),
  bio: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  displayOrder: z.number().int().default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
  initialData?: {
    id: string;
    name: string;
    title: string | null;
    bio: string | null;
    email: string | null;
    displayOrder: number;
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
      bio: initialData?.bio || "",
      email: initialData?.email || null,
      displayOrder: initialData?.displayOrder || 0,
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="e.g. Senior Mathematics Teacher"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Professional title or role within the institution
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={isLoading}
                      placeholder="Enter teacher's bio"
                      className="resize-none"
                      rows={5}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

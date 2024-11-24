// app/admin/projects/components/project-form.tsx
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";

// Form validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  slug: z
    .string()
    .min(2, { message: "Slug must be at least 2 characters long" })
    .max(50, { message: "Slug cannot exceed 50 characters" })
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: "Slug can only contain letters, numbers, and dashes",
    }),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters" })
    .optional()
    .nullable(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    published: boolean;
    featured: boolean;
    heroImage: { url: string } | null;
  };
}

export function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [heroImage, setHeroImage] = useState<{
    url: string;
    fileKey: string;
  } | null>(
    initialData?.heroImage
      ? {
          url: initialData.heroImage.url,
          fileKey: "", // You might want to store this in your database
        }
      : null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      published: initialData?.published || false,
      featured: initialData?.featured || false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const url = initialData?.id
        ? `/api/projects/${initialData.id}`
        : "/api/projects";

      const response = await fetch(url, {
        method: initialData?.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          heroImage,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(
        initialData?.id
          ? "Project updated successfully"
          : "Project created successfully"
      );

      router.push("/admin/projects");
      router.refresh();
    } catch (error) {
      console.error("[PROJECT_FORM_ERROR]", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Project" : "Create New Project"}
        </CardTitle>
        <CardDescription>
          {initialData
            ? "Make changes to your project"
            : "Add a new project to your portfolio"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Hero Image Upload Section */}
            <div className="space-y-4">
              <FormLabel>Hero Image</FormLabel>
              <div className="flex items-center gap-x-4">
                <div className="relative h-40 w-40">
                  {heroImage ? (
                    <Image
                      src={heroImage.url}
                      alt="Hero image"
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="h-full w-full bg-secondary rounded-md" />
                  )}
                </div>
                <div className="space-y-2">
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setHeroImage({
                          url: res[0].url,
                          fileKey: res[0].key,
                        });
                        toast.success("Hero image uploaded successfully");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Upload failed: ${error.message}`);
                    }}
                  />
                  {heroImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setHeroImage(null)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove image
                    </Button>
                  )}
                </div>
              </div>
              <Separator />
            </div>

            {/* Form Fields */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Enter project name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="project-slug"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be used in the URL of your project
                  </FormDescription>
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
                      placeholder="Enter project description"
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

            <div className="flex flex-col gap-4">
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
                        This project will be visible to the public
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured</FormLabel>
                      <FormDescription>
                        This project will be highlighted on the homepage
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/projects")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save changes" : "Create project"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

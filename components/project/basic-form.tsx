// components/project/basic-form.tsx
"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import * as z from "zod";
import Image from "next/image";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadButton } from "@/lib/uploadthing";
import { toast } from "sonner";
import { ProjectBasicInfo } from "@/store/use-project-form";
import { RichTextEditor } from "../rich-text-editor";

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
    .nullable(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface BasicFormProps {
  value: ProjectBasicInfo;
  onChange: (values: ProjectBasicInfo) => void;
  isLoading?: boolean;
}

export function BasicForm({
  value,
  onChange,
  isLoading = false,
}: BasicFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: value.name || "",
      slug: value.slug || "",
      description: value.description || "",
      published: value.published || false,
      featured: value.featured || false,
    },
    values: value, // Add this line to update form when value prop changes
  });

  // Watch form values and update parent
  useEffect(() => {
    const subscription = form.watch((formData) => {
      onChange({
        ...formData,
        heroImage: value.heroImage,
      } as ProjectBasicInfo);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onChange, value.heroImage, form]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Hero Image Upload Section */}
        <div className="space-y-4">
          <FormLabel>Hero Image</FormLabel>
          <div className="flex items-center gap-x-4">
            <div className="relative h-40 w-40">
              {value.heroImage ? (
                <Image
                  src={value.heroImage.url}
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
                    onChange({
                      ...value,
                      heroImage: {
                        url: res[0].url,
                        fileKey: res[0].key,
                      },
                    });
                    toast.success("Hero image uploaded successfully");
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
              />
              {value.heroImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onChange({ ...value, heroImage: null })}
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
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={isLoading}
                  placeholder="Write a description..."
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
      </form>
    </Form>
  );
}

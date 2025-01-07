// components/forms/testimonial-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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
import { UploadButton } from "@/lib/uploadthing";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  role: z.string().min(2, "Role must be at least 2 characters long"),
  content: z.string().min(10, "Testimonial must be at least 10 characters long"),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface TestimonialFormProps {
  initialData?: {
    id: string;
    name: string;
    role: string;
    content: string;
    published: boolean;
    featured: boolean;
    photo: { url: string } | null;
  };
}

export function TestimonialForm({ initialData }: TestimonialFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<{
    url: string;
    fileKey: string;
  } | null>(initialData?.photo ? { url: initialData.photo.url, fileKey: "" } : null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      role: initialData?.role || "",
      content: initialData?.content || "",
      published: initialData?.published || false,
      featured: initialData?.featured || false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const url = initialData?.id
        ? `/api/testimonials/${initialData.id}`
        : "/api/testimonials";

      const response = await fetch(url, {
        method: initialData?.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          photo,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(
        initialData?.id
          ? "Testimonial updated successfully"
          : "Testimonial created successfully"
      );
      router.push("/admin/testimonials");
      router.refresh();
    } catch (error) {
      console.error("[TESTIMONIAL_FORM_ERROR]", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Testimonial" : "Add Testimonial"}
        </CardTitle>
        <CardDescription>
          {initialData
            ? "Make changes to an existing testimonial"
            : "Add a new testimonial to showcase on your website"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Photo Upload */}
            <div className="space-y-4">
              <FormLabel>Photo</FormLabel>
              <div className="flex items-center gap-x-4">
                <div className="relative h-20 w-20">
                  {photo ? (
                    <Image
                      src={photo.url}
                      alt="Testimonial"
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-secondary" />
                  )}
                </div>
                <div className="space-y-2">
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setPhoto({
                          url: res[0].url,
                          fileKey: res[0].key,
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
                      onClick={() => setPhoto(null)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove photo
                    </Button>
                  )}
                </div>
              </div>
              <Separator />
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Enter name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="e.g. Student, Parent"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Testimonial</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={isLoading}
                        placeholder="Enter testimonial content"
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Publishing Options */}
            <div className="space-y-4">
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
                        This testimonial will be visible on your website
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
                        Feature this testimonial in prominent locations
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
                onClick={() => router.push("/admin/testimonials")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save changes" : "Create testimonial"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
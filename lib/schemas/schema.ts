import { z } from "zod";

export const teacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional().nullable(),
  photo: z
    .object({
      url: z.string().url(),
      fileKey: z.string(),
      size: z.number(),
      mimeType: z.string(),
    })
    .optional()
    .nullable(),
});

export const projectSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().nullable(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  heroImage: z
    .object({
      url: z.string().url(),
      fileKey: z.string(),
    })
    .nullable()
    .optional(),
  teacherIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const projectPhaseSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(2, "Description is required"),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  completed: z.boolean().default(false),
  order: z.number().int().min(0),
  media: z
    .object({
      url: z.string().url(),
      fileKey: z.string(),
    })
    .nullable()
    .optional(),
});

export const galleryImageSchema = z.object({
  url: z.string().url(),
  fileKey: z.string(),
  alt: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type ProjectPhaseFormValues = z.infer<typeof projectPhaseSchema>;
export type GalleryImageFormValues = z.infer<typeof galleryImageSchema>;

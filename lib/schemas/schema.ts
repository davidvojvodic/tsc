import { z } from "zod";

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

export const teacherSchema = z.object({
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
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional()
    .nullable(),
  displayOrder: z.number().int().default(0),
  photo: z
    .object({
      url: z.string().url(),
      fileKey: z.string(),
      size: z.number(),
      mimeType: z.string(),
    })
    .nullable()
    .optional(),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
export type ProjectFormValues = z.infer<typeof projectSchema>;
export type ProjectPhaseFormValues = z.infer<typeof projectPhaseSchema>;
export type GalleryImageFormValues = z.infer<typeof galleryImageSchema>;

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
});

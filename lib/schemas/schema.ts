import { z } from "zod";

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
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional()
    .nullable(),
  displayOrder: z.number().int().default(0),
  school: z.enum(["tsc", "pts"]).optional().nullable(),
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

export const materialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_sl: z.string().optional().nullable(),
  title_hr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  description_sl: z.string().optional().nullable(),
  description_hr: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  published: z.boolean().default(true),
  file: z
    .object({
      url: z.string().url(),
      key: z.string(),
      name: z.string(),
      size: z.number(),
    })
    .optional(),
});

// Similar updates for other schemas like projectSchema, testimonialSchema, etc.
export type TeacherFormValues = z.infer<typeof teacherSchema>;
export type MaterialFormValues = z.infer<typeof materialSchema>;

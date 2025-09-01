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

// Shared Project Validation Schemas
export const heroImageSchema = z
  .object({
    url: z.string().url(),
    ufsUrl: z.string().url().optional(),
    fileKey: z.string(),
    size: z.number().optional(),
    mimeType: z.string().optional(),
  })
  .nullable();

export const projectActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),
  description: z.string(),
  description_sl: z.string().nullable(),
  description_hr: z.string().nullable(),
  order: z.number(),
  teacherIds: z.array(z.string()),
  imageIds: z.array(z.string()),
  materialIds: z.array(z.string()).optional(),
});

export const projectPhaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),
  startDate: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional()
  ),
  endDate: z.preprocess(
    (val) => (val ? new Date(val as string) : null),
    z.date().nullable().optional()
  ),
  completed: z.boolean(),
  order: z.number(),
  activities: z.array(projectActivitySchema).optional(),
});

export const projectGalleryImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  fileKey: z.string(),
  alt: z.string().nullable(),
});

export const projectBasicInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_sl: z.string().nullable(),
  name_hr: z.string().nullable(),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable(),
  description_sl: z.string().nullable(),
  description_hr: z.string().nullable(),
  published: z.boolean(),
  featured: z.boolean(),
  heroImage: heroImageSchema,
});

export const projectCreateSchema = z.object({
  basicInfo: projectBasicInfoSchema,
  timeline: z.array(projectPhaseSchema),
  gallery: z.array(projectGalleryImageSchema),
  teacherIds: z.array(z.string()),
});

export const projectUpdateBasicInfoSchema = projectBasicInfoSchema;

export const projectUpdateTimelineSchema = z.object({
  timeline: z.array(projectPhaseSchema),
});

export const projectUpdateGallerySchema = z.object({
  gallery: z.array(projectGalleryImageSchema),
});

export const projectUpdateTeachersSchema = z.object({
  teacherIds: z.array(z.string()),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
export type MaterialFormValues = z.infer<typeof materialSchema>;
export type ProjectBasicInfoFormValues = z.infer<typeof projectBasicInfoSchema>;
export type ProjectCreateFormValues = z.infer<typeof projectCreateSchema>;
export type HeroImageFormValues = z.infer<typeof heroImageSchema>;

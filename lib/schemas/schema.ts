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

import { z } from "zod";

export const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),

  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .min(2)
    .max(50),

  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export const signInFormSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .min(2)
    .max(50),
  password: z.string().min(1, { message: "Password is required" }),
});

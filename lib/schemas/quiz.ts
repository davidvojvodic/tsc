// lib/schemas/quiz.ts
import * as z from "zod";

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  correct: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z.array(optionSchema).min(2, "At least 2 options are required"),
});

export const quizSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z.string().optional(),
  teacherId: z.string().min(1, "Please select a teacher"),
  questions: z.array(questionSchema).min(1, "At least 1 question is required"),
});

export type QuizSchemaType = z.infer<typeof quizSchema>;
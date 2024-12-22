"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  Form,
  FormControl,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Form validation schema
const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
});

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z.array(optionSchema).min(2, "At least 2 options are required"),
  correctOptionIndex: z.number().min(0, "Please select the correct answer"),
});

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters long"),
  description: z.string().optional(),
  teacherId: z.string().min(1, "Please select a teacher"),
  questions: z.array(questionSchema).min(1, "At least 1 question is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface Teacher {
  id: string;
  name: string;
}

interface QuizFormProps {
  teachers: Teacher[];
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    teacherId: string;
    questions: Array<{
      id: string;
      text: string;
      options: Array<{
        id: string;
        text: string;
        correct: boolean;
      }>;
    }>;
  };
}

function QuestionFieldArray({
  questionIndex,
  control,
  isLoading,
}: {
  questionIndex: number;
  control: Control<FormValues>;
  isLoading: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <Label>Answer Options</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ text: "" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </div>

      <FormField
        control={control}
        name={`questions.${questionIndex}.correctOptionIndex`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                disabled={isLoading}
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value.toString()}
                className="grid gap-4"
              >
                {fields.map((optionField, optionIndex) => (
                  <div
                    key={optionField.id}
                    className="flex items-start space-x-4"
                  >
                    <RadioGroupItem
                      value={optionIndex.toString()}
                      id={`q${questionIndex}-opt${optionIndex}`}
                      className="mt-3"
                    />
                    <div className="flex-1">
                      <FormField
                        control={control}
                        name={`questions.${questionIndex}.options.${optionIndex}.text`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  {...field}
                                  disabled={isLoading}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                {fields.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => remove(optionIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export function QuizForm({ teachers, initialData }: QuizFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Transform initial data for the form
  const defaultValues = initialData
    ? {
        title: initialData.title,
        description: initialData.description || "",
        teacherId: initialData.teacherId,
        questions: initialData.questions.map((q) => {
          const correctOptionIndex = q.options.findIndex((o) => o.correct);
          return {
            text: q.text,
            options: q.options.map((o) => ({ text: o.text })),
            correctOptionIndex,
          };
        }),
      }
    : {
        title: "",
        description: "",
        teacherId: "",
        questions: [
          {
            text: "",
            options: [{ text: "" }, { text: "" }],
            correctOptionIndex: 0,
          },
        ],
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields: questionFields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      // Transform the form data to match the API structure
      const transformedData = {
        ...values,
        questions: values.questions.map((q) => ({
          text: q.text,
          options: q.options.map((o, index) => ({
            text: o.text,
            correct: index === q.correctOptionIndex,
          })),
        })),
      };

      const url = initialData ? `/api/quizzes/${initialData.id}` : "/api/quizzes";
      const method = initialData ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(
        initialData ? "Quiz updated successfully" : "Quiz created successfully"
      );
      router.push("/admin/quizzes");
      router.refresh();
    } catch (error) {
      console.error("[QUIZ_FORM_ERROR]", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Quiz" : "Create Quiz"}</CardTitle>
        <CardDescription>
          {initialData
            ? "Make changes to your quiz"
            : "Create a new quiz with questions and answers"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Enter quiz title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={isLoading}
                        placeholder="Enter quiz description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Questions Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Questions</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    append({
                      text: "",
                      options: [{ text: "" }, { text: "" }],
                      correctOptionIndex: 0,
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>

              {questionFields.map((field, questionIndex) => (
                <Card key={field.id} className="border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Question {questionIndex + 1}
                      </CardTitle>
                      {questionFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(questionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name={`questions.${questionIndex}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea
                              disabled={isLoading}
                              placeholder="Enter your question"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <QuestionFieldArray
                        questionIndex={questionIndex}
                        control={form.control}
                        isLoading={isLoading}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {form.formState.errors.questions?.root && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {form.formState.errors.questions.root.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/quizzes")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Save changes" : "Create quiz"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
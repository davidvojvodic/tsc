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
import { Label } from "@/components/ui/label";
import { MultipleChoiceEditor } from "@/components/admin/quiz/multiple-choice-editor";
import { TextInputEditor } from "@/components/admin/quiz/text-input-editor";

import { quizSchema } from "@/lib/schemas/quiz";

type FormValues = z.infer<typeof quizSchema>;

interface Teacher {
  id: string;
  name: string;
}

interface QuizFormProps {
  teachers: Teacher[];
  initialData?: {
    id: string;
    title: string;
    title_sl?: string;
    title_hr?: string;
    description: string | null;
    description_sl?: string;
    description_hr?: string;
    teacherId: string;
    questions: Array<{
      id: string;
      text: string;
      text_sl?: string;
      text_hr?: string;
      questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT";
      options?: Array<{
        id: string;
        text: string;
        text_sl?: string;
        text_hr?: string;
        correct: boolean;
      }>;
      multipleChoiceData?: {
        scoringMethod: "ALL_OR_NOTHING" | "PARTIAL_CREDIT";
        minSelections: number;
        maxSelections?: number;
        partialCreditRules?: {
          correctSelectionPoints: number;
          incorrectSelectionPenalty: number;
          minScore: number;
        };
      };
      textInputData?: {
        inputType: "text" | "number" | "email" | "url";
        acceptableAnswers: string[];
        caseSensitive: boolean;
        numericTolerance?: number;
        placeholder?: string;
        placeholder_sl?: string;
        placeholder_hr?: string;
      };
    }>;
  };
}

function SingleChoiceEditor({
  questionIndex,
  control,
  isLoading,
  form,
}: {
  questionIndex: number;
  control: Control<FormValues>;
  isLoading: boolean;
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Answer Options</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ text: "", text_sl: "", text_hr: "", isCorrect: false })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((optionField, optionIndex) => (
          <Card key={optionField.id} className="border-dashed">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Correct option radio */}
                <div className="flex items-center justify-between">
                  <FormField
                    control={control}
                    name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <input
                            type="radio"
                            name={`correct-option-${questionIndex}`}
                            checked={field.value}
                            onChange={() => {
                              // Set all options to false first
                              fields.forEach((_, idx) => {
                                form.setValue(`questions.${questionIndex}.options.${idx}.isCorrect`, false);
                              });
                              // Set this option to true
                              form.setValue(`questions.${questionIndex}.options.${optionIndex}.isCorrect`, true);
                            }}
                            disabled={isLoading}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          This is the correct answer
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {fields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(optionIndex)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Option text fields */}
                <div className="space-y-3">
                  <FormField
                    control={control}
                    name={`questions.${questionIndex}.options.${optionIndex}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option Text (English)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            disabled={isLoading}
                            placeholder={`Option ${optionIndex + 1} in English`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={control}
                      name={`questions.${questionIndex}.options.${optionIndex}.text_sl`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option Text (Slovenian)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              disabled={isLoading}
                              placeholder={`Možnost ${optionIndex + 1} v slovenščini`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`questions.${questionIndex}.options.${optionIndex}.text_hr`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option Text (Croatian)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              disabled={isLoading}
                              placeholder={`Opcija ${optionIndex + 1} na hrvatskom`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function QuizForm({ teachers, initialData }: QuizFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Transform initial data for the form
  const defaultValues = initialData
    ? {
        title: initialData.title,
        title_sl: initialData.title_sl || "",
        title_hr: initialData.title_hr || "",
        description: initialData.description || "",
        description_sl: initialData.description_sl || "",
        description_hr: initialData.description_hr || "",
        teacherId: initialData.teacherId,
        questions: initialData.questions.map((q) => ({
          text: q.text,
          text_sl: q.text_sl || "",
          text_hr: q.text_hr || "",
          questionType: (q.questionType || "SINGLE_CHOICE") as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT",
          ...(q.questionType !== "TEXT_INPUT" && {
            options: q.options?.map((o) => ({
              text: o.text,
              text_sl: o.text_sl || "",
              text_hr: o.text_hr || "",
              isCorrect: o.correct ?? false, // Use nullish coalescing to default to false
            })) || [],
          }),
          ...(q.questionType === "MULTIPLE_CHOICE" && {
            multipleChoiceData: q.multipleChoiceData || {
              scoringMethod: "ALL_OR_NOTHING" as const,
              minSelections: 1,
              maxSelections: undefined,
              partialCreditRules: {
                correctSelectionPoints: 1,
                incorrectSelectionPenalty: 0,
                minScore: 0,
              },
            },
          }),
          ...(q.questionType === "TEXT_INPUT" && {
            textInputData: q.textInputData || {
              inputType: "text" as const,
              acceptableAnswers: [""],
              caseSensitive: false,
              numericTolerance: undefined,
              placeholder: "",
              placeholder_sl: "",
              placeholder_hr: "",
            },
          }),
        })),
      }
    : {
        title: "",
        title_sl: "",
        title_hr: "",
        description: "",
        description_sl: "",
        description_hr: "",
        teacherId: "",
        questions: [
          {
            text: "",
            text_sl: "",
            text_hr: "",
            questionType: "SINGLE_CHOICE" as const,
            options: [
              { text: "", text_sl: "", text_hr: "", isCorrect: true },
              { text: "", text_sl: "", text_hr: "", isCorrect: false },
            ],
          },
        ],
      };

  const form = useForm<FormValues>({
    resolver: zodResolver(quizSchema),
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
          text_sl: q.text_sl,
          text_hr: q.text_hr,
          questionType: q.questionType,
          ...(q.questionType !== "TEXT_INPUT" && {
            options: q.options?.map((o) => ({
              text: o.text,
              text_sl: o.text_sl,
              text_hr: o.text_hr,
              isCorrect: o.isCorrect,
            })) || [],
          }),
          ...(q.questionType === "MULTIPLE_CHOICE" && {
            multipleChoiceData: q.multipleChoiceData,
          }),
          ...(q.questionType === "TEXT_INPUT" && {
            textInputData: q.textInputData,
          }),
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
                    <FormLabel>Title (English)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={isLoading}
                        placeholder="Enter quiz title in English"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title_sl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Slovenian)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading}
                          placeholder="Vnesi naslov kviza v slovenščini"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title_hr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Croatian)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading}
                          placeholder="Unesite naslov kviza na hrvatskom"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (English, Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        disabled={isLoading}
                        placeholder="Enter quiz description in English"
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description_sl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Slovenian, Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading}
                          placeholder="Vnesi opis kviza v slovenščini"
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description_hr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Croatian, Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          disabled={isLoading}
                          placeholder="Unesite opis kviza na hrvatskom"
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                      text_sl: "",
                      text_hr: "",
                      questionType: "SINGLE_CHOICE",
                      options: [
                        { text: "", text_sl: "", text_hr: "", isCorrect: true },
                        { text: "", text_sl: "", text_hr: "", isCorrect: false },
                      ],
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>

              {questionFields.map((field, questionIndex) => {
                const questionType = form.watch(`questions.${questionIndex}.questionType`);

                return (
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
                      {/* Question Type Selection */}
                      <FormField
                        control={form.control}
                        name={`questions.${questionIndex}.questionType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Type</FormLabel>
                            <Select
                              disabled={isLoading}
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select question type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SINGLE_CHOICE">Single Choice (Radio Buttons)</SelectItem>
                                <SelectItem value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</SelectItem>
                                <SelectItem value="TEXT_INPUT">Text Input</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Conditional Question Editor */}
                      {questionType === "MULTIPLE_CHOICE" ? (
                        <MultipleChoiceEditor
                          questionIndex={questionIndex}
                          control={form.control}
                          isLoading={isLoading}
                        />
                      ) : questionType === "TEXT_INPUT" ? (
                        <TextInputEditor
                          questionIndex={questionIndex}
                          control={form.control}
                          isLoading={isLoading}
                        />
                      ) : (
                        <SingleChoiceEditor
                          questionIndex={questionIndex}
                          control={form.control}
                          isLoading={isLoading}
                          form={form}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}

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
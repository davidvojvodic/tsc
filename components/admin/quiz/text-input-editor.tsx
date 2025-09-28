"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic form paths require 'any' type assertion for react-hook-form compatibility

import React from "react";
import { useFieldArray, Control } from "react-hook-form";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import * as z from "zod";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { quizSchema } from "@/lib/schemas/quiz";

type FormValues = z.infer<typeof quizSchema>;

interface TextInputEditorProps {
  questionIndex: number;
  control: Control<FormValues>;
  isLoading: boolean;
}

export function TextInputEditor({
  questionIndex,
  control,
  isLoading,
}: TextInputEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.textInputData.acceptableAnswers` as any,
  });

  const watchedInputType = control._formValues?.questions?.[questionIndex]
    ?.textInputData?.inputType;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Question Text Fields */}
        <div className="space-y-4">
          <FormField
            control={control}
            name={`questions.${questionIndex}.text` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question Text (English)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isLoading}
                    placeholder="Enter question text in English"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name={`questions.${questionIndex}.text_sl` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text (Slovenian)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isLoading}
                      placeholder="Vnesi besedilo vprašanja v slovenščini"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`questions.${questionIndex}.text_hr` as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text (Croatian)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isLoading}
                      placeholder="Unesite tekst pitanja na hrvatskom"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Text Input Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Text Input Settings</CardTitle>
            <CardDescription>
              Configure the input type and validation rules for this text input question
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input Type */}
            <FormField
              control={control}
              name={`questions.${questionIndex}.textInputData.inputType` as any}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Input Type</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          <strong>Text:</strong> Any text input<br />
                          <strong>Number:</strong> Numeric values with tolerance<br />
                          <strong>Email:</strong> Email format validation<br />
                          <strong>URL:</strong> Web address format validation
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value || "text"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select input type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Validation Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Case Sensitivity - only for text inputs */}
              {watchedInputType === "text" && (
                <FormField
                  control={control}
                  name={`questions.${questionIndex}.textInputData.caseSensitive` as any}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Case Sensitive
                        </FormLabel>
                        <FormDescription>
                          Answers must match exact capitalization
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Numeric Tolerance - only for number inputs */}
              {watchedInputType === "number" && (
                <FormField
                  control={control}
                  name={`questions.${questionIndex}.textInputData.numericTolerance` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numeric Tolerance</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={isLoading}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ""}
                          placeholder="0.1"
                        />
                      </FormControl>
                      <FormDescription>
                        Acceptable range (+/-) from correct answer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Placeholder Text */}
            <div className="space-y-4">
              <FormField
                control={control}
                name={`questions.${questionIndex}.textInputData.placeholder` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placeholder Text (English)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading}
                        placeholder="Optional placeholder text for students"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`questions.${questionIndex}.textInputData.placeholder_sl` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder Text (Slovenian)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isLoading}
                          placeholder="Napotek za študente v slovenščini"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`questions.${questionIndex}.textInputData.placeholder_hr` as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder Text (Croatian)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isLoading}
                          placeholder="Smjernica za studente na hrvatskom"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Acceptable Answers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Acceptable Answers</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Add all acceptable answers for this question. Students only need to match one of these answers.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append("")}
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Answer
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((answerField, answerIndex) => (
              <Card key={answerField.id} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <FormField
                        control={control}
                        name={`questions.${questionIndex}.textInputData.acceptableAnswers.${answerIndex}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Answer {answerIndex + 1}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isLoading}
                                placeholder={
                                  watchedInputType === "number"
                                    ? "42.5"
                                    : watchedInputType === "email"
                                    ? "example@email.com"
                                    : watchedInputType === "url"
                                    ? "https://example.com"
                                    : "Acceptable answer text"
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive self-end mb-2"
                        onClick={() => remove(answerIndex)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
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

interface MultipleChoiceEditorProps {
  questionIndex: number;
  control: Control<FormValues>;
  isLoading: boolean;
}

export function MultipleChoiceEditor({
  questionIndex,
  control,
  isLoading,
}: MultipleChoiceEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
  });

  const watchedScoringMethod = control._formValues?.questions?.[questionIndex]
    ?.multipleChoiceData?.scoringMethod;

  const watchedMaxSelections = control._formValues?.questions?.[questionIndex]
    ?.multipleChoiceData?.maxSelections;

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

        {/* Multiple Choice Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Multiple Choice Settings</CardTitle>
            <CardDescription>
              Configure how this multiple choice question will be scored and validated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scoring Method */}
            <FormField
              control={control}
              name={`questions.${questionIndex}.multipleChoiceData.scoringMethod` as any}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Scoring Method</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          <strong>All or Nothing:</strong> Full points only if all correct answers are selected.<br />
                          <strong>Partial Credit:</strong> Points given for each correct selection, with optional penalties for incorrect ones.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value || "ALL_OR_NOTHING"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scoring method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ALL_OR_NOTHING">All or Nothing</SelectItem>
                      <SelectItem value="PARTIAL_CREDIT">Partial Credit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selection Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name={`questions.${questionIndex}.multipleChoiceData.minSelections` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Selections</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        disabled={isLoading}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        value={field.value || 1}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum number of options students must select
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`questions.${questionIndex}.multipleChoiceData.maxSelections` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Selections (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max={fields.length}
                        disabled={isLoading}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ""}
                        placeholder="No limit"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of options students can select (leave empty for no limit)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Partial Credit Rules */}
            {watchedScoringMethod === "PARTIAL_CREDIT" && (
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Partial Credit Rules</CardTitle>
                  <CardDescription className="text-xs">
                    Configure how points are awarded for correct and incorrect selections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name={`questions.${questionIndex}.multipleChoiceData.partialCreditRules.correctSelectionPoints` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points per Correct Selection</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.1"
                              min="0"
                              disabled={isLoading}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                              value={field.value || 1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`questions.${questionIndex}.multipleChoiceData.partialCreditRules.incorrectSelectionPenalty` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penalty per Incorrect Selection</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.1"
                              max="0"
                              disabled={isLoading}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || -0.5)}
                              value={field.value || -0.5}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`questions.${questionIndex}.multipleChoiceData.partialCreditRules.minScore` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Score</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.1"
                              min="0"
                              disabled={isLoading}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              value={field.value || 0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Answer Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Answer Options</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Add answer options and mark which ones are correct.
                {watchedMaxSelections && ` (Limit: ${watchedMaxSelections} selections)`}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ text: "", text_sl: "", text_hr: "", isCorrect: false })}
              disabled={isLoading}
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
                    {/* Correct option checkbox */}
                    <div className="flex items-center justify-between">
                      <FormField
                        control={control}
                        name={`questions.${questionIndex}.options.${optionIndex}.isCorrect` as any}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              This is a correct answer
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
                        name={`questions.${questionIndex}.options.${optionIndex}.text` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option Text (English)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
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
                          name={`questions.${questionIndex}.options.${optionIndex}.text_sl` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Option Text (Slovenian)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
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
                          name={`questions.${questionIndex}.options.${optionIndex}.text_hr` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Option Text (Croatian)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
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
      </div>
    </TooltipProvider>
  );
}
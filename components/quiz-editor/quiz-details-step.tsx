"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuizEditor, Language } from "./quiz-editor-provider";
import { LanguageTabs } from "./language-tabs";
import type { Teacher } from "./quiz-editor-layout";

interface QuizDetailsStepProps {
  teachers: Teacher[];
  onNext: () => void;
  onCancel?: () => void;
}

export function QuizDetailsStep({ teachers, onNext, onCancel }: QuizDetailsStepProps) {
  const { quiz, updateQuiz, currentLanguage, setCurrentLanguage } = useQuizEditor();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateAndProceed = () => {
    const errors: string[] = [];

    // Check if at least one language has a title
    const hasTitle = (quiz.title && quiz.title.trim().length > 0) ||
                     (quiz.title_sl && quiz.title_sl.trim().length > 0) ||
                     (quiz.title_hr && quiz.title_hr.trim().length > 0);

    if (!hasTitle) {
      errors.push("Quiz title is required in at least one language");
    }

    if (!quiz.teacherId) {
      errors.push("Please select a teacher");
    }

    setValidationErrors(errors);

    if (errors.length === 0) {
      onNext();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {quiz.id ? "Edit Quiz Details" : "Create New Quiz"}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Set up your quiz title, description, and teacher assignment
              </p>
            </div>
          </div>
        </div>

        <LanguageTabs
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hasContent={{
            en: Boolean(quiz.title || quiz.description),
            sl: Boolean(quiz.title_sl || quiz.description_sl),
            hr: Boolean(quiz.title_hr || quiz.description_hr)
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={currentLanguage} onValueChange={(value) => setCurrentLanguage(value as Language)} className="w-full">
            <TabsContent value="en" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Quiz Title (English)
                  </Label>
                  <Input
                    id="title"
                    value={quiz.title || ""}
                    onChange={(e) => updateQuiz({ title: e.target.value })}
                    placeholder="Enter quiz title..."
                    className={validationErrors.some(e => e.includes("title")) ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">At least one language is required</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher" className="text-sm font-medium">
                    Teacher <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={quiz.teacherId}
                    onValueChange={(value) => updateQuiz({ teacherId: value })}
                  >
                    <SelectTrigger className={validationErrors.some(e => e.includes("teacher")) ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={quiz.description || ""}
                  onChange={(e) => updateQuiz({ description: e.target.value })}
                  placeholder="Enter quiz description..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="sl" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title-sl" className="text-sm font-medium">Quiz Title (Slovenian)</Label>
                <Input
                  id="title-sl"
                  value={quiz.title_sl || ""}
                  onChange={(e) => updateQuiz({ title_sl: e.target.value })}
                  placeholder="Vnesite naslov kviza..."
                  className={validationErrors.some(e => e.includes("title")) ? "border-red-500" : ""}
                />
                <p className="text-xs text-muted-foreground">Vsaj en jezik je obvezen</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description-sl" className="text-sm font-medium">Description (Slovenian)</Label>
                <Textarea
                  id="description-sl"
                  value={quiz.description_sl || ""}
                  onChange={(e) => updateQuiz({ description_sl: e.target.value })}
                  placeholder="Vnesite opis kviza..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="hr" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title-hr" className="text-sm font-medium">Quiz Title (Croatian)</Label>
                <Input
                  id="title-hr"
                  value={quiz.title_hr || ""}
                  onChange={(e) => updateQuiz({ title_hr: e.target.value })}
                  placeholder="Unesite naslov kviza..."
                  className={validationErrors.some(e => e.includes("title")) ? "border-red-500" : ""}
                />
                <p className="text-xs text-muted-foreground">Potreban je barem jedan jezik</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description-hr" className="text-sm font-medium">Description (Croatian)</Label>
                <Textarea
                  id="description-hr"
                  value={quiz.description_hr || ""}
                  onChange={(e) => updateQuiz({ description_hr: e.target.value })}
                  placeholder="Unesite opis kviza..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer with Navigation */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-end">
          <Button
            onClick={validateAndProceed}
            className="flex items-center gap-2"
          >
            Next: Add Questions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
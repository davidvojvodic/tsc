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
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { useQuizEditor, Language } from "./quiz-editor-provider";
import { LanguageTabs } from "./language-tabs";
import { AutoSaveIndicator } from "./autosave-indicator";
import type { Teacher } from "./quiz-editor-layout";
import { useRouter } from "next/navigation";

interface QuizEditorHeaderProps {
  teachers: Teacher[];
  onSave?: () => Promise<void>;
  onCancel?: () => void;
}

export function QuizEditorHeader({ teachers, onSave, onCancel }: QuizEditorHeaderProps) {
  const { quiz, updateQuiz, currentLanguage, setCurrentLanguage, hasUnsavedChanges, saveQuiz } = useQuizEditor();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave();
      } else {
        await saveQuiz();
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/admin/quizzes");
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quizzes
          </Button>
          <div className="text-sm text-muted-foreground">
            {quiz.id ? `Editing Quiz` : `Creating New Quiz`}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutoSaveIndicator />
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save Quiz"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <LanguageTabs
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hasContent={{
            en: Boolean(quiz.title || quiz.description),
            sl: Boolean(quiz.title_sl || quiz.description_sl),
            hr: Boolean(quiz.title_hr || quiz.description_hr)
          }}
        />

        <Tabs value={currentLanguage} onValueChange={(value) => setCurrentLanguage(value as Language)} className="w-full">
          <TabsContent value="en" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={quiz.title}
                  onChange={(e) => updateQuiz({ title: e.target.value })}
                  placeholder="Enter quiz title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Teacher</Label>
                <Select
                  value={quiz.teacherId}
                  onValueChange={(value) => updateQuiz({ teacherId: value })}
                >
                  <SelectTrigger>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={quiz.description || ""}
                onChange={(e) => updateQuiz({ description: e.target.value })}
                placeholder="Enter quiz description..."
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="sl" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title-sl">Quiz Title (Slovenian)</Label>
                <Input
                  id="title-sl"
                  value={quiz.title_sl || ""}
                  onChange={(e) => updateQuiz({ title_sl: e.target.value })}
                  placeholder="Vnesite naslov kviza..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description-sl">Description (Slovenian)</Label>
                <Textarea
                  id="description-sl"
                  value={quiz.description_sl || ""}
                  onChange={(e) => updateQuiz({ description_sl: e.target.value })}
                  placeholder="Vnesite opis kviza..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hr" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title-hr">Quiz Title (Croatian)</Label>
                <Input
                  id="title-hr"
                  value={quiz.title_hr || ""}
                  onChange={(e) => updateQuiz({ title_hr: e.target.value })}
                  placeholder="Unesite naslov kviza..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description-hr">Description (Croatian)</Label>
                <Textarea
                  id="description-hr"
                  value={quiz.description_hr || ""}
                  onChange={(e) => updateQuiz({ description_hr: e.target.value })}
                  placeholder="Unesite opis kviza..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
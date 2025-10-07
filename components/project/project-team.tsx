"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap } from "lucide-react";
import { TeacherDialog } from "../teacher-dialog";
import { useLanguage } from "@/store/language-context";
import { getLocalizedContent } from "@/lib/language-utils";
import { Teacher } from "@/lib/types";
import { SupportedLanguage } from "@/store/language-context";

interface ProjectTeamProps {
  teachers: Teacher[];
  language?: SupportedLanguage;
}

export function ProjectTeam({
  teachers,
  language: propLanguage,
}: ProjectTeamProps) {
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(
    null
  );
  const [teamDialogOpen, setTeamDialogOpen] = React.useState(false);
  const languageContext = useLanguage();

  // Use language from props if provided (for server components), otherwise use context
  const language = propLanguage || languageContext.language;

  if (!teachers.length) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {language === "en" && "Project Team"}
            {language === "sl" && "Projektna ekipa"}
            {language === "hr" && "Projektni tim"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {teachers.map((teacher) => {
              const title = getLocalizedContent(teacher, "title", language);

              return (
                <div
                  key={teacher.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => {
                    setSelectedTeacher(teacher);
                    setTeamDialogOpen(true);
                  }}
                >
                  <Avatar className="h-12 w-12">
                    {teacher.photo?.url ? (
                      <Image
                        src={teacher.photo.url}
                        alt={teacher.name}
                        fill
                        quality={70}
                        sizes="144px"
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback>
                        {teacher.name[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">{teacher.name}</div>
                    {title && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {title}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TeacherDialog
        teacher={selectedTeacher}
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        language={language}
      />
    </>
  );
}

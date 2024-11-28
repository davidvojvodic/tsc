"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap } from "lucide-react";
import { TeacherDialog } from "../teacher-dialog";

interface Teacher {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo: { url: string } | null;
  createdAt?: Date;
  email?: string | null;
}

interface ProjectTeamProps {
  teachers: Teacher[];
}

export function ProjectTeam({ teachers }: ProjectTeamProps) {
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(
    null
  );
  const [teamDialogOpen, setTeamDialogOpen] = React.useState(false);

  if (!teachers.length) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Project Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => {
                  setSelectedTeacher(teacher);
                  setTeamDialogOpen(true);
                }}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={teacher.photo?.url} />
                  <AvatarFallback>
                    {teacher.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{teacher.name}</div>
                  {teacher.title && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {teacher.title}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TeacherDialog
        teacher={selectedTeacher}
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
      />
    </>
  );
}

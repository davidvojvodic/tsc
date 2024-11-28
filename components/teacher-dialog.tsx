"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface Teacher {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo: { url: string } | null;
  createdAt?: Date;
  email?: string | null;
}

interface TeacherDialogProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherDialog({
  teacher,
  open,
  onOpenChange,
}: TeacherDialogProps) {
  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <div className="grid lg:grid-cols-[280px,1fr] h-full">
          {/* Left Column - Photo and Basic Info */}
          <div className="relative bg-muted p-6 flex flex-col items-center text-center lg:h-full">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-background shadow-lg mb-4">
              {teacher.photo ? (
                <Image
                  src={teacher.photo.url}
                  alt={teacher.name}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-5xl font-semibold text-primary">
                    {teacher.name[0]}
                  </span>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-semibold">{teacher.name}</h2>
            {teacher.title && (
              <Badge variant="secondary" className="mt-2 text-base">
                {teacher.title}
              </Badge>
            )}

            <div className="mt-6 space-y-3 w-full">
              {teacher.email && (
                <div className="flex items-center gap-2 text-sm bg-background p-3 rounded-md">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground truncate">
                    {teacher.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Bio and Details */}
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5" />
                  About
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {teacher.bio || "No bio available"}
                </p>
              </div>

              <Separator />

              {/* Additional sections could go here */}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

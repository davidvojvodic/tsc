// components/teacher-card.tsx
"use client";
import Image from "next/image";
import { useLanguage } from "@/store/language-context";
import { getLocalizedContent } from "@/lib/language-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Teacher {
  id: string;
  name: string;
  title?: string | null;
  title_sl?: string | null;
  title_hr?: string | null;
  bio?: string | null;
  bio_sl?: string | null;
  bio_hr?: string | null;
  photo?: { url: string } | null;
}

export function TeacherCard({
  teacher,
  onClick,
}: {
  teacher: Teacher;
  onClick?: () => void;
}) {
  const { language } = useLanguage();

  const title = getLocalizedContent(teacher, "title", language);
  const bio = getLocalizedContent(teacher, "bio", language);

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="p-6">
        <Avatar className="h-24 w-24 mx-auto">
          {teacher.photo?.url ? (
            <Image
              src={teacher.photo.url}
              alt={teacher.name}
              fill
              quality={70}
              sizes="288px"
              className="object-cover"
            />
          ) : (
            <AvatarFallback>{teacher.name[0]}</AvatarFallback>
          )}
        </Avatar>
      </div>
      <CardHeader className="px-6 pb-2 pt-0">
        <CardTitle className="text-xl text-center">{teacher.name}</CardTitle>
        <CardDescription className="text-center">
          {title || "Teacher"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <p className="text-muted-foreground line-clamp-3 text-center">
          {bio || "No bio available"}
        </p>
      </CardContent>
    </Card>
  );
}

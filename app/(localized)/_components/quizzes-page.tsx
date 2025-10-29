"use client";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrainCircuit, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SupportedLanguage } from "@/store/language-context";

interface Quiz {
  id: string;
  title: string | null;
  title_sl?: string | null;
  title_hr?: string | null;
  description: string | null;
  description_sl?: string | null;
  description_hr?: string | null;
  teacher: {
    name: string;
    photo: {
      url: string;
    } | null;
  };
  questions: {
    id: string;
  }[];
}

interface QuizzesPageProps {
  quizzes: Quiz[];
  language: SupportedLanguage;
}

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      title: "Knowledge Check",
      description: "Test your understanding with our interactive quizzes. Track your progress and learn at your own pace.",
      questions: "Questions",
      estimated: "Estimated",
      minutes: "minutes",
      startQuiz: "Start Quiz"
    },
    sl: {
      title: "Preverjanje znanja",
      description: "Preverite svoje razumevanje z našimi interaktivnimi kvizi. Sledite svojemu napredku in se učite v svojem tempu.",
      questions: "Vprašanj",
      estimated: "Ocenjeno",
      minutes: "minut",
      startQuiz: "Začnite kviz"
    },
    hr: {
      title: "Provjera znanja",
      description: "Testirajte svoje razumijevanje s našim interaktivnim kvizovima. Pratite svoj napredak i učite vlastitim tempom.",
      questions: "Pitanja",
      estimated: "Procijenjeno",
      minutes: "minuta",
      startQuiz: "Započni kviz"
    }
  };
  
  return translations[language];
};

export function QuizzesPage({ quizzes, language }: QuizzesPageProps) {
  const t = getTranslations(language);
  const prefix = language === "en" ? "" : `/${language}`;
  
  return (
    <Container>
      <div className="py-16 md:py-24">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        {/* Quiz Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const title = language === "en" ? quiz.title :
                        language === "sl" ? (quiz.title_sl || quiz.title) :
                        (quiz.title_hr || quiz.title);
            
            const description = language === "en" ? quiz.description :
                              language === "sl" ? (quiz.description_sl || quiz.description) :
                              (quiz.description_hr || quiz.description);
            
            return (
              <Card key={quiz.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="line-clamp-2">{title}</CardTitle>
                    <BrainCircuit className="h-5 w-5 text-primary" />
                  </div>
                  {description && (
                    <CardDescription className="line-clamp-2">
                      {description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      <div className="flex items-center gap-2">
                        {quiz.teacher.photo ? (
                          <Image
                            src={quiz.teacher.photo.url}
                            alt={quiz.teacher.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : null}
                        <span>{quiz.teacher.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {quiz.questions.length} {t.questions}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {t.estimated} {Math.ceil(quiz.questions.length * 1.5)} {t.minutes}
                    </span>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`${prefix}/quizzes/${quiz.id}`}>{t.startQuiz}</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
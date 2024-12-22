// app/(public)/quizzes/page.tsx
import prisma from "@/lib/prisma";
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

async function getQuizzes() {
  const quizzes = await prisma.quiz.findMany({
    include: {
      teacher: {
        include: {
          photo: true,
        },
      },
      questions: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return quizzes;
}

export default async function QuizzesPage() {
  const quizzes = await getQuizzes();

  return (
    <Container>
      <div className="py-16 md:py-24">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Knowledge Check
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Test your understanding with our interactive quizzes. Track your
            progress and learn at your own pace.
          </p>
        </div>

        {/* Quiz Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                {quiz.description && (
                  <CardDescription className="line-clamp-2">
                    {quiz.description}
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
                    {quiz.questions.length} Questions
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    Estimated {Math.ceil(quiz.questions.length * 1.5)} minutes
                  </span>
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/quizzes/${quiz.id}`}>Start Quiz</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Container>
  );
}
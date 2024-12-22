// app/(public)/quizzes/[id]/page.tsx
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import QuizComponent from "@/components/quiz";


async function getQuiz(id: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            photo: true,
          },
        },
        questions: {
          include: {
            options: {
              select: {
                id: true,
                text: true,
              },
            },
          },
        },
      },
    });

    return quiz;
  } catch (error) {
    console.error("[GET_QUIZ]", error);
    throw new Error("Failed to fetch quiz");
  }
}

export default async function QuizPage({
  params,
}: {
  params: { id: string };
}) {
  const quiz = await getQuiz(params.id);

  if (!quiz) {
    notFound();
  }

  // Hide correct answers from the client
  const sanitizedQuestions = quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
  }));

  return (
    <Container>
      <div className="py-16">
        <QuizComponent
          id={quiz.id}
          title={quiz.title}
          description={quiz.description}
          questions={sanitizedQuestions}
        />
      </div>
    </Container>
  );
}
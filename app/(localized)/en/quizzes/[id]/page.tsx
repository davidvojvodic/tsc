import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { QuizDetailPage } from "../../../_components/quiz-detail-page";

async function getQuiz(id: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true
          },
          orderBy: {
            createdAt: "asc",
          }
        },
      },
    });
    
    return quiz;
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return null;
  }
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuiz(id);

  if (!quiz) {
    notFound();
  }
  
  // Transform the data to match the expected interface
  const transformedQuiz = {
    ...quiz,
    questions: quiz.questions.map(question => ({
      ...question,
      options: question.options.map(option => ({
        ...option,
        isCorrect: option.correct // Map 'correct' to 'isCorrect'
      }))
    }))
  };

  return <QuizDetailPage quiz={transformedQuiz} language="en" />;
}
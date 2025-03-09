import prisma from "@/lib/prisma";
import { QuizzesPage } from "../../_components/quizzes-page";

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

export default async function QuizzesPageRoute() {
  const quizzes = await getQuizzes();
  
  return <QuizzesPage quizzes={quizzes} language="hr" />;
}
import { HeroSection } from "@/components/homepage/hero";
import TeacherCarousel from "@/components/homepage/teacher-carousel";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import SchoolsSection from "@/components/homepage/schools";

export default async function Home() {
  const headersObj = await headers();
  const session = await auth.api.getSession({
    headers: headersObj,
  });

  console.log(session);

  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      name: true,
      bio: true,
      title: true,
      email: true,
      displayOrder: true,
      photo: {
        select: {
          url: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <HeroSection />
      <TeacherCarousel teachers={teachers} />
      <SchoolsSection />
    </>
  );
}

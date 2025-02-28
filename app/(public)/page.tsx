// app/(public)/page.tsx
import { HeroSection } from "@/components/homepage/hero";
import TeacherCarousel from "@/components/homepage/teacher-carousel";
import TestimonialsSection from "@/components/homepage/testimonials";
import SchoolsSection from "@/components/homepage/schools";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export default async function Home() {
  const headersObj = await headers();
  const session = await auth.api.getSession({
    headers: headersObj,
  });

  console.log("Session:", session);

  // Fetch published testimonials
  const testimonials = await prisma.testimonial.findMany({
    where: {
      published: true,
    },
    select: {
      id: true,
      name: true,
      role: true,
      content: true,
      photo: {
        select: {
          url: true,
        },
      },
    },
    orderBy: [
      {
        featured: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 6, // Limit to 6 testimonials
  });

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
      <TestimonialsSection testimonials={testimonials} />
      <SchoolsSection />
    </>
  );
}

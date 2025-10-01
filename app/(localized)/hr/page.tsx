// app/(localized)/hr/page.tsx
import { HeroSection } from "@/components/homepage/hero";
import TeacherCarousel from "@/components/homepage/teacher-carousel";
import TestimonialsSection from "@/components/homepage/testimonials";
import SchoolsSection from "@/components/homepage/schools";
import VideoSection from "@/components/homepage/video-section";
import { ContactSection } from "@/components/homepage/contact-section";
import prisma from "@/lib/prisma";
import LiveStreams from "@/components/live-streams";

export default async function HomePage() {
  // Fetch published testimonials
  const testimonials = await prisma.testimonial.findMany({
    where: {
      published: true,
    },
    select: {
      id: true,
      name: true,
      role: true,
      role_sl: true,
      role_hr: true,
      content: true,
      content_sl: true,
      content_hr: true,
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
    where: {
      visible: true,
    },
    select: {
      id: true,
      name: true,
      bio: true,
      bio_sl: true,
      bio_hr: true,
      title: true,
      title_sl: true,
      title_hr: true,
      email: true,
      displayOrder: true,
      school: true,
      photo: {
        select: {
          url: true,
        },
      },
    },
    orderBy: {
      displayOrder: "asc", // Order by displayOrder instead of createdAt
    },
  });

  return (
    <>
      <HeroSection />
      <VideoSection locale="hr" />
      <TeacherCarousel teachers={teachers} />
      <TestimonialsSection testimonials={testimonials} />
      <LiveStreams />
      <SchoolsSection />
      <ContactSection locale="hr" />
    </>
  );
}

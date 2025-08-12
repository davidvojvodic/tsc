// app/admin/testimonials/page.tsx
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TestimonialClient } from "./components/client";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export default async function TestimonialsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAuthorized = await checkAdminAccess(session.user.id);
  if (!isAuthorized) {
    redirect("/");
  }

  const testimonials = await prisma.testimonial.findMany({
    include: {
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

  const formattedTestimonials = testimonials.map((testimonial) => ({
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    content: testimonial.content,
    featured: testimonial.featured,
    published: testimonial.published,
    photo: testimonial.photo,
    createdAt: format(testimonial.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <TestimonialClient data={formattedTestimonials} />
      </div>
    </div>
  );
}
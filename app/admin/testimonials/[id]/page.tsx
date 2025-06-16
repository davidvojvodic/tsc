// app/admin/testimonials/[id]/page.tsx
import prisma from "@/lib/prisma";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TestimonialForm } from "@/components/forms/testimonials-form";

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

export default async function TestimonialPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAuthorized = await checkAdminAccess(session.user.id);
  if (!isAuthorized) {
    redirect("/");
  }

  const testimonial =
    params.id !== "new"
      ? await prisma.testimonial.findUnique({
          where: { id: params.id },
          include: {
            photo: {
              select: {
                url: true,
              },
            },
          },
        })
      : null;

  const formattedTestimonial = testimonial
    ? {
        id: testimonial.id,
        name: testimonial.name,
        role: testimonial.role,
        role_sl: testimonial.role_sl,
        role_hr: testimonial.role_hr,
        content: testimonial.content,
        content_sl: testimonial.content_sl,
        content_hr: testimonial.content_hr,
        featured: testimonial.featured,
        published: testimonial.published,
        photo: testimonial.photo,
      }
    : undefined;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <TestimonialForm initialData={formattedTestimonial} />
      </div>
    </div>
  );
}
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectDetailPage } from "../../../_components/project-detail-page";

async function getProject(slug: string) {
  const project = await prisma.project.findUnique({
    where: {
      slug,
      published: true,
    },
    include: {
      heroImage: true,
      gallery: true,
      teachers: {
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
          photo: {
            select: {
              url: true,
            },
          },
        },
      },
      quizzes: true,
      timeline: {
        include: {
          media: true,
          gallery: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return project;
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await getProject(params.slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetailPage project={project} language="en" />;
}

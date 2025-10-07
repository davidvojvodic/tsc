import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProjectDetailPage } from "../../../_components/project-detail-page";
import { getLocalizedContent } from "@/lib/language-utils";

async function getProject(slug: string) {
  const project = await prisma.project.findUnique({
    where: {
      slug,
      published: true,
    },
    include: {
      heroImage: {
        select: {
          url: true,
          alt: true,
          alt_sl: true,
          alt_hr: true,
        },
      },
      gallery: {
        include: {
          media: {
            select: {
              id: true,
              url: true,
              alt: true,
              alt_sl: true,
              alt_hr: true,
            },
          },
        },
      },
      teachers: {
        include: {
          teacher: {
            include: {
              photo: {
                select: {
                  url: true,
                  alt: true,
                  alt_sl: true,
                  alt_hr: true,
                },
              },
            },
          },
        },
      },
      quizzes: true,
      timeline: {
        include: {
          activities: {
            include: {
              teachers: {
                include: {
                  teacher: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              images: {
                include: {
                  media: {
                    select: {
                      id: true,
                      url: true,
                      alt: true,
                      alt_sl: true,
                      alt_hr: true,
                    },
                  },
                },
                orderBy: {
                  order: "asc",
                },
              },
              materials: {
                include: {
                  material: {
                    select: {
                      id: true,
                      title: true,
                      type: true,
                      url: true,
                      size: true,
                      language: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  // Transform the data to match the component's expected format
  const transformedProject = {
    ...project,
    gallery: project.gallery.map((g) => ({
      id: g.media.id,
      url: g.media.url,
      alt: getLocalizedContent(g.media, "alt", "en"),
    })),
    teachers: project.teachers.map((t) => ({
      id: t.teacher.id,
      name: t.teacher.name,
      bio: t.teacher.bio,
      bio_sl: t.teacher.bio_sl,
      bio_hr: t.teacher.bio_hr,
      title: t.teacher.title,
      title_sl: t.teacher.title_sl,
      title_hr: t.teacher.title_hr,
      email: t.teacher.email,
      displayOrder: t.teacher.displayOrder,
      photo: t.teacher.photo,
    })),
  };

  return <ProjectDetailPage project={transformedProject} language="en" />;
}

// app/admin/projects/[id]/page.tsx
import { ProjectForm } from "@/components/forms/project-form";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProjectFormData, Teacher } from "@/lib/types";

interface PageParams {
  params: {
    id: string; // Changed from projectId to id to match route parameter
  };
}

export default async function ProjectPage({ params }: PageParams) {
  // Only fetch project data if we're not creating a new project
  const isNew = params.id === "new";

  // Fetch project data if editing
  const project = !isNew
    ? await prisma.project.findUnique({
        where: {
          id: params.id, // Changed from projectId to id
        },
        include: {
          heroImage: true,
          gallery: true,
          teachers: {
            include: {
              photo: true,
            },
          },
          timeline: {
            include: {
              media: true, // Primary media
              gallery: true, // Gallery of images (new relation)
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      })
    : null;

  // If we're editing (not creating new) and can't find the project, return 404
  if (!isNew && !project) {
    notFound();
  }

  // Fetch all available teachers
  const teachers = await prisma.teacher.findMany({
    include: {
      photo: true,
    },
  });

  const formattedProject: ProjectFormData | undefined = project
    ? {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description || "",
        published: project.published,
        featured: project.featured,
        heroImage: project.heroImage
          ? {
              url: project.heroImage.url,
              id: project.heroImage.id, // Include the 'id' property
            }
          : null,
        gallery: project.gallery.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
        })),
        timeline: project.timeline.map((phase) => ({
          id: phase.id,
          title: phase.title,
          description: phase.description,
          startDate: phase.startDate ?? undefined, // Convert 'null' to 'undefined'
          endDate: phase.endDate ?? undefined, // Convert 'null' to 'undefined'
          completed: phase.completed,
          mediaId: phase.media?.id, // Primary media ID
          mediaUrl: phase.media?.url, // Primary media URL
          // Include gallery images if available
          galleryImages: phase.gallery?.map(img => ({
            id: img.id,
            url: img.url,
            alt: img.alt
          })) || []
          // Removed 'order' since it's not defined in ProjectFormData
        })),
        teachers: project.teachers.map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          photo: teacher.photo ? { url: teacher.photo.url } : null,
        })),
      }
    : undefined;

  const formattedTeachers: Teacher[] = teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    photo: teacher.photo ? { url: teacher.photo.url } : null,
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProjectForm
          initialData={formattedProject}
          availableTeachers={formattedTeachers}
        />
      </div>
    </div>
  );
}

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
              activities: {
                include: {
                  teachers: {
                    include: {
                      teacher: true,
                    },
                  },
                  images: {
                    include: {
                      media: true,
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
          // Include activities if available
          activities: phase.activities?.map(activity => {
            
            return {
              id: activity.id,
              title: activity.title,
              title_sl: activity.title_sl,
              title_hr: activity.title_hr,
              description: activity.description,
              description_sl: activity.description_sl,
              description_hr: activity.description_hr,
              order: activity.order,
              // Extract teacher IDs for the form
              teacherIds: activity.teachers ? activity.teachers.map(t => t.teacher.id) : [],
              // Extract image IDs for the form  
              imageIds: activity.images ? activity.images.map(i => i.media.id) : [],
              // Keep raw data for reference
              teachers: activity.teachers,
              images: activity.images,
            };
          }) || []
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

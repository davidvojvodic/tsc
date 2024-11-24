// app/admin/projects/[projectId]/page.tsx
import prisma from "@/lib/prisma";
import { ProjectForm } from "@/components/forms/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project =
    params.id !== "new"
      ? await prisma.project.findUnique({
          where: { id: params.id },
          include: {
            heroImage: true,
          },
        })
      : null;

  const formattedProject = project
    ? {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        published: project.published,
        featured: project.featured,
        heroImage: project.heroImage ? { url: project.heroImage.url } : null,
      }
    : undefined;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProjectForm initialData={formattedProject} />
      </div>
    </div>
  );
}

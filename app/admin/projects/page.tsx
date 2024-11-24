// app/admin/projects/page.tsx
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { ProjectClient } from "./components/client";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      heroImage: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    published: project.published,
    featured: project.featured,
    heroImage: project.heroImage ? { url: project.heroImage.url } : null,
    createdAt: format(project.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProjectClient data={formattedProjects} />
      </div>
    </div>
  );
}

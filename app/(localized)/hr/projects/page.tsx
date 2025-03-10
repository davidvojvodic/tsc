import prisma from "@/lib/prisma";
import { ProjectsPage } from "../../_components/projects-page";

async function getProjects() {
  const projects = await prisma.project.findMany({
    where: {
      published: true,
    },
    include: {
      heroImage: true,
      teachers: true,
      timeline: {
        select: {
          startDate: true,
          completed: true,
        },
      },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  // Add empty tags array to each project to fix type error
  return projects.map(project => ({
    ...project,
    tags: [],
  }));
}

export default async function ProjectsPageRoute() {
  const projects = await getProjects();

  return <ProjectsPage projects={projects} language="hr" />;
}

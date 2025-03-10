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

  return projects;
}

export default async function ProjectsPageRoute() {
  const projects = await getProjects();

  return <ProjectsPage projects={projects} language="hr" />;
}

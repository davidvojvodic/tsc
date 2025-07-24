import prisma from "@/lib/prisma";
import { ProjectsPage } from "../../_components/projects-page";

async function getProjects() {
  const projects = await prisma.project.findMany({
    where: {
      published: true,
    },
    include: {
      heroImage: true,
      teachers: {
        include: {
          teacher: true,
        },
      },
      timeline: {
        select: {
          startDate: true,
          completed: true,
        },
      },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  // Transform the data to match the component's expected format
  return projects.map(project => ({
    ...project,
    tags: [],
    teachers: project.teachers.map(t => t.teacher),
  }));
}

export default async function ProjectsPageRoute() {
  const projects = await getProjects();

  return <ProjectsPage projects={projects} language="sl" />;
}

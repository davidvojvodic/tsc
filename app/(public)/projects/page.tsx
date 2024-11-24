// app/(public)/projects/page.tsx
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getProjects() {
  const projects = await prisma.project.findMany({
    where: {
      published: true,
    },
    include: {
      heroImage: true,
      tags: true,
    },
    orderBy: [
      {
        featured: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  return projects;
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <Container>
      <div className="py-16 md:py-24">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Our Projects
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our innovative projects and initiatives that are making a
            difference in our community and beyond.
          </p>
        </div>

        {/* Featured Project (if exists) */}
        {projects.find((p) => p.featured) && (
          <div className="mb-24">
            {projects
              .filter((p) => p.featured)
              .map((project) => (
                <div
                  key={project.id}
                  className="relative overflow-hidden rounded-xl border bg-background"
                >
                  {project.heroImage && (
                    <div className="relative h-[400px] w-full">
                      <Image
                        src={project.heroImage.url}
                        alt={project.name}
                        fill
                        className="object-cover"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background to-background/20" />
                    </div>
                  )}
                  <div className="relative p-6 sm:p-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="bg-primary/10">
                        Featured Project
                      </Badge>
                      {project.tags?.map((tag) => (
                        <Badge key={tag.id} variant="outline">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                      {project.name}
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      {project.description}
                    </p>
                    <Button asChild>
                      <Link href={`/projects/${project.slug}`}>
                        Learn more
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Project Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects
            .filter((p) => !p.featured)
            .map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group relative overflow-hidden rounded-lg border bg-background transition-colors hover:bg-accent"
              >
                {project.heroImage && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={project.heroImage.url}
                      alt={project.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{project.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  {project.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </div>
    </Container>
  );
}

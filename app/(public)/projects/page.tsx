import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getProjects() {
  const projects = await prisma.project.findMany({
    where: {
      published: true,
    },
    include: {
      heroImage: true,
      tags: true,
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

export default async function ProjectsPage() {
  const projects = await getProjects();
  const categories = [
    ...new Set(projects.flatMap((p) => p.tags.map((t) => t.name))),
  ];

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

        {/* Featured Projects */}
        {projects.find((p) => p.featured) && (
          <div className="mb-24 space-y-8">
            <h2 className="text-2xl font-semibold">Featured Projects</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {projects
                .filter((p) => p.featured)
                .map((project) => (
                  <Card
                    key={project.id}
                    className="group overflow-hidden border-0 bg-background"
                  >
                    {project.heroImage && (
                      <div className="relative h-[300px] w-full overflow-hidden">
                        <Image
                          src={project.heroImage.url}
                          alt={project.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/40" />

                        <div className="absolute bottom-4 left-4 right-4 px-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-primary text-primary-foreground"
                            >
                              Featured
                            </Badge>
                            {project.tags?.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="outline"
                                className="bg-background/50 backdrop-blur-sm"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {project.name}
                          </h3>
                        </div>
                      </div>
                    )}
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        {project.timeline[0]?.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Started{" "}
                            {new Date(
                              project.timeline[0].startDate
                            ).toLocaleDateString()}
                          </div>
                        )}
                        {project.teachers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {project.teachers.length} Team Members
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-6 line-clamp-2">
                        {project.description}
                      </p>
                      <Button asChild>
                        <Link href={`/projects/${project.slug}`}>
                          View Project
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Project Tabs and Grid */}
        <div className="space-y-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="all">All Projects</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects
                  .filter((p) => !p.featured)
                  .map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.slug}`}
                      className="group relative overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent"
                    >
                      {project.heroImage && (
                        <div className="relative h-48 w-full overflow-hidden bg-muted">
                          <Image
                            src={project.heroImage.url}
                            alt={project.name}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          {project.timeline[0]?.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(
                                project.timeline[0].startDate
                              ).toLocaleDateString()}
                            </div>
                          )}
                          {project.teachers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {project.teachers.length}
                            </div>
                          )}
                        </div>

                        <h3 className="text-xl font-semibold mb-2">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {project.description}
                        </p>

                        {project.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
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
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {projects
                    .filter(
                      (p) =>
                        !p.featured && p.tags.some((t) => t.name === category)
                    )
                    .map((project) => (
                      // Same project card component as above
                      <Link
                        key={project.id}
                        href={`/projects/${project.slug}`}
                        className="group relative overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent"
                      >
                        {project.heroImage && (
                          <div className="relative h-48 w-full overflow-hidden bg-muted">
                            <Image
                              src={project.heroImage.url}
                              alt={project.name}
                              fill
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            {project.timeline[0]?.startDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(
                                  project.timeline[0].startDate
                                ).toLocaleDateString()}
                              </div>
                            )}
                            {project.teachers.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {project.teachers.length}
                              </div>
                            )}
                          </div>

                          <h3 className="text-xl font-semibold mb-2">
                            {project.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {project.description}
                          </p>

                          {project.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
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
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </Container>
  );
}

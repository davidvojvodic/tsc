// app/(public)/projects/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Tag,
  GraduationCap,
  BrainCircuit,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface ProjectPageProps {
  params: {
    slug: string;
  };
}

async function getProject(slug: string) {
  const project = await prisma.project.findUnique({
    where: {
      slug,
      published: true,
    },
    include: {
      heroImage: true,
      gallery: true,
      tags: true,
      teachers: {
        include: {
          photo: true,
        },
      },
      quizzes: true,
      timeline: {
        orderBy: {
          startDate: "asc",
        },
      },
    },
  });

  return project;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.slug);

  if (!project) {
    notFound();
  }

  return (
    <Container>
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] w-full mb-10">
        {project.heroImage ? (
          <Image
            src={project.heroImage.url}
            alt={project.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-black/40" />

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <Button asChild className="mb-6">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {project.name}
          </h1>
          <p className="text-lg max-w-2xl text-white/90">
            {project.description}
          </p>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid gap-8 md:grid-cols-[2fr,1fr] mb-16">
        <div className="space-y-6">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">About this Project</h2>
            <p>{project.description}</p>
          </div>

          {/* Timeline */}
          {project.timeline.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Project Timeline</h2>
              <div className="space-y-8">
                {project.timeline.map((phase, index) => (
                  <div key={phase.id} className="relative pl-8 pb-8">
                    {/* Timeline line */}
                    {index !== project.timeline.length - 1 && (
                      <div className="absolute left-[11px] top-3 h-full w-[2px] bg-border" />
                    )}
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-0 top-[6px] h-6 w-6 rounded-full border-2 ${
                        phase.completed
                          ? "bg-primary border-primary"
                          : "bg-background border-primary"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          {format(phase.startDate, "MMM yyyy")}
                          {phase.endDate &&
                            ` - ${format(phase.endDate, "MMM yyyy")}`}
                        </Badge>
                        {phase.completed && (
                          <Badge variant="secondary">Completed</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {phase.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {phase.description}
                      </p>
                      {phase.mediaId && (
                        <div className="mt-4 relative h-48 w-full rounded-lg overflow-hidden">
                          <Image
                            src={phase.mediaId}
                            alt={phase.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Stats */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Project Details</h3>
            <div className="space-y-4">
              {project.teachers.length > 0 && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium mb-1">Teachers</div>
                    <div className="flex flex-wrap gap-2">
                      {project.teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className="flex items-center gap-2"
                        >
                          {teacher.photo && (
                            <Image
                              src={teacher.photo.url}
                              alt={teacher.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {teacher.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {project.quizzes.length > 0 && (
                <div className="flex items-start gap-3">
                  <BrainCircuit className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium mb-1">Quizzes</div>
                    <div className="text-sm text-muted-foreground">
                      {project.quizzes.length} quizzes available
                    </div>
                  </div>
                </div>
              )}

              {project.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gallery */}
          {project.gallery.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Project Gallery</h3>
              <div className="grid grid-cols-2 gap-2">
                {project.gallery.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square rounded-md overflow-hidden"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || "Project image"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

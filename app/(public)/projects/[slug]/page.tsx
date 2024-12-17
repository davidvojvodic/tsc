import Image from "next/image";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BrainCircuit, ArrowLeft, Calendar, Expand } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GalleryView } from "@/components/project/gallery-view";
import { ProjectTeam } from "@/components/project/project-team";
import { RichTextDisplay } from "@/components/rich-text-content";

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
        include: {
          media: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return project;
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await getProject(params.slug);

  if (!project) {
    notFound();
  }

  // Calculate project stats
  const completedPhases = project.timeline.filter((p) => p.completed).length;
  const completionPercentage = Math.round(
    (completedPhases / project.timeline.length) * 100
  );

  return (
    <Container>
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] w-full mb-10 rounded-xl overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <Button asChild variant="outline" size="sm" className="mb-6">
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            {project.name}
          </h1>
        </div>
      </div>

      {/* Project Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>About this Project</CardTitle>
          <CardDescription>Project overview and details</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextDisplay
            className="mb-3"
            content={project.description || ""}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="text-xl font-semibold">
                {project.timeline[0]?.startDate
                  ? format(project.timeline[0].startDate, "MMM yyyy")
                  : "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Team Size</p>
              <p className="text-xl font-semibold">
                {project.teachers.length} members
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-xl font-semibold">{completionPercentage}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Resources</p>
              <p className="text-xl font-semibold">
                {project.quizzes.length} quizzes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Content Grid */}
      <div className="grid gap-8 md:grid-cols-[2fr,1fr] mb-16">
        <div className="space-y-8">
          {/* Timeline */}
          {project.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Track the project&apos;s progress and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {project.timeline.map((phase, index) => (
                    <div key={phase.id} className="relative pl-8 pb-8">
                      {index !== project.timeline.length - 1 && (
                        <div className="absolute left-[11px] top-3 h-full w-[2px] bg-border" />
                      )}

                      <div
                        className={cn(
                          "absolute left-0 top-[6px] h-6 w-6 rounded-full border-2 transition-colors",
                          phase.completed
                            ? "bg-primary border-primary"
                            : "bg-background border-primary"
                        )}
                      />

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {(phase.startDate || phase.endDate) && (
                            <Badge variant="outline">
                              <Calendar className="mr-1 h-3 w-3" />
                              {phase.startDate &&
                                format(phase.startDate, "MMM d, yyyy")}
                              {phase.endDate &&
                                ` - ${format(phase.endDate, "MMM d, yyyy")}`}
                            </Badge>
                          )}
                          {phase.completed && (
                            <Badge variant="secondary">Completed</Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-semibold mb-2">
                          {phase.title}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {phase.description}
                        </p>

                        {phase.media && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="relative h-[200px] w-full sm:w-[300px] rounded-lg overflow-hidden cursor-pointer group">
                                <Image
                                  src={phase.media.url}
                                  alt={phase.title}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Expand className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>{phase.title}</DialogTitle>
                              </DialogHeader>
                              <div className="relative h-[600px] w-full">
                                <Image
                                  src={phase.media.url}
                                  alt={phase.title}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Teachers */}
          {project.teachers.length > 0 && (
            <ProjectTeam teachers={project.teachers} />
          )}

          {/* Gallery */}
          {project.gallery.length > 0 && (
            <GalleryView images={project.gallery} />
          )}
          {/* Resources */}
          {project.quizzes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" />
                  Learning Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {quiz.description ||
                            "Take this quiz to test your knowledge"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/quizzes/${quiz.id}`}>Start Quiz</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}

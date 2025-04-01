"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BrainCircuit, ArrowLeft, Calendar, Expand } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GalleryView, GalleryImage } from "@/components/project/gallery-view";
import { ProjectTeam } from "@/components/project/project-team";
import { RichTextDisplay } from "@/components/rich-text-content";
import { getLocalizedContent } from "@/lib/language-utils";
import { SupportedLanguage } from "@/store/language-context";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Define types for the project and related data
interface Project {
  id: string;
  name: string;
  name_sl?: string | null;
  name_hr?: string | null;
  slug: string;
  description: string | null;
  description_sl?: string | null;
  description_hr?: string | null;
  featured: boolean;
  published: boolean;
  heroImage: {
    url: string;
  } | null;
  gallery: {
    id: string;
    url: string;
  }[];
  teachers: {
    id: string;
    name: string;
    bio: string | null;
    bio_sl: string | null;
    bio_hr: string | null;
    title: string | null;
    title_sl: string | null;
    title_hr: string | null;
    email: string | null;
    displayOrder: number;
    photo: {
      url: string;
    } | null;
  }[];
  quizzes: {
    id: string;
    title: string;
    title_sl?: string | null;
    title_hr?: string | null;
    description: string | null;
    description_sl?: string | null;
    description_hr?: string | null;
  }[];
  timeline: {
    id: string;
    title: string;
    title_sl?: string | null;
    title_hr?: string | null;
    description: string | null;
    description_sl?: string | null;
    description_hr?: string | null;
    startDate: Date | null;
    endDate: Date | null;
    completed: boolean;
    order: number;
    media:
      | {
          id: string;
          url: string;
        }[]
      | {
          id: string;
          url: string;
        }
      | null;
    gallery?: {
      id: string;
      url: string;
    }[];
  }[];
}

interface ProjectDetailPageProps {
  project: Project;
  language: SupportedLanguage;
}

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      backToProjects: "Back to Projects",
      aboutThisProject: "About this Project",
      projectOverview: "Project overview and details",
      startDate: "Start Date",
      notSpecified: "Not specified",
      teamSize: "Team Size",
      members: "members",
      completion: "Completion",
      resources: "Resources",
      quizzes: "quizzes",
      projectTimeline: "Project Timeline",
      trackProgress: "Track the project's progress and milestones",
      completed: "Completed",
      learningResources: "Learning Resources",
      takeQuiz: "Take this quiz to test your knowledge",
      startQuiz: "Start Quiz",
      projectGallery: "Project Gallery",
    },
    sl: {
      backToProjects: "Nazaj na projekte",
      aboutThisProject: "O tem projektu",
      projectOverview: "Pregled in podrobnosti projekta",
      startDate: "Datum začetka",
      notSpecified: "Ni določeno",
      teamSize: "Velikost ekipe",
      members: "članov",
      completion: "Dokončanje",
      resources: "Viri",
      quizzes: "kvizov",
      projectTimeline: "Časovnica projekta",
      trackProgress: "Sledite napredku in mejnikom projekta",
      completed: "Končano",
      learningResources: "Učni viri",
      takeQuiz: "Rešite ta kviz, da preverite svoje znanje",
      startQuiz: "Začni kviz",
      projectGallery: "Galerija projekta",
    },
    hr: {
      backToProjects: "Natrag na projekte",
      aboutThisProject: "O ovom projektu",
      projectOverview: "Pregled i detalji projekta",
      startDate: "Datum početka",
      notSpecified: "Nije određeno",
      teamSize: "Veličina tima",
      members: "članova",
      completion: "Završetak",
      resources: "Resursi",
      quizzes: "kvizova",
      projectTimeline: "Vremenski okvir projekta",
      trackProgress: "Pratite napredak i prekretnice projekta",
      completed: "Završeno",
      learningResources: "Obrazovni resursi",
      takeQuiz: "Riješite ovaj kviz da testirate svoje znanje",
      startQuiz: "Započni kviz",
      projectGallery: "Galerija projekta",
    },
  };

  return translations[language];
};

export function ProjectDetailPage({
  project,
  language,
}: ProjectDetailPageProps) {
  const t = getTranslations(language);
  const prefix = language === "en" ? "" : `/${language}`;

  // Get localized content
  const projectName = getLocalizedContent(project, "name", language);
  const projectDescription = getLocalizedContent(
    project,
    "description",
    language
  );

  // Calculate project stats
  const completedPhases = project.timeline.filter((p) => p.completed).length;
  const completionPercentage = Math.round(
    (completedPhases / project.timeline.length) * 100
  );

  // Combine all project media for the gallery - no need to separate by phase for the main gallery
  const allProjectImages: GalleryImage[] = [
    // Regular gallery images
    ...(project.gallery || []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: projectName || project.name,
    })),

    // Get all phase images in a flat list
    ...(project.timeline || []).flatMap((phase) => {
      const images: GalleryImage[] = [];

      // Add primary media if it exists
      if (phase.media) {
        if (
          !Array.isArray(phase.media) &&
          typeof phase.media === "object" &&
          phase.media.url
        ) {
          images.push({
            id: phase.id + "-media",
            url: phase.media.url,
            alt: getLocalizedContent(phase, "title", language) || phase.title,
          });
        } else if (Array.isArray(phase.media)) {
          phase.media.forEach((img) => {
            images.push({
              id: img.id,
              url: img.url,
              alt: getLocalizedContent(phase, "title", language) || phase.title,
            });
          });
        }
      }

      // Add gallery images
      if (
        phase.gallery &&
        Array.isArray(phase.gallery) &&
        phase.gallery.length > 0
      ) {
        phase.gallery.forEach((img) => {
          images.push({
            id: img.id,
            url: img.url,
            alt: getLocalizedContent(phase, "title", language) || phase.title,
          });
        });
      }

      return images;
    }),
  ];

  return (
    <Container>
      {/* Improved Hero Section with better text visibility */}
      <div className="relative w-full my-12">
        {/* Back button - placed outside for visibility and consistency */}
        <div className="mb-4">
          <Button asChild variant="outline" size="sm" className="group">
            <Link
              href={`${prefix}/projects`}
              className="flex items-center text-sm font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {t.backToProjects}
            </Link>
          </Button>
        </div>

        {/* Hero container */}
        <div className="w-full rounded-xl overflow-hidden shadow-lg">
          {/* Project title card - always visible regardless of image color */}
          <div className="relative z-10 bg-card border-b">
            <div className="container px-6 py-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {project.timeline.length > 0 &&
                  project.timeline[0].startDate && (
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(project.timeline[0].startDate, "MMM yyyy")}
                    </Badge>
                  )}

                <Badge variant="secondary">
                  <BrainCircuit className="h-3 w-3 mr-1" />
                  {completionPercentage}% {t.completed}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                {projectName || project.name}
              </h1>
            </div>
          </div>

          {/* Hero image section */}
          <div className="relative h-[40vh] md:h-[50vh] w-full">
            {project.heroImage ? (
              <Image
                src={project.heroImage.url}
                alt={projectName || project.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                <div className="p-8 text-center text-muted-foreground">
                  <BrainCircuit className="mx-auto h-16 w-16 mb-4 opacity-20" />
                  <p>{t.projectOverview}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t.aboutThisProject}</CardTitle>
          <CardDescription>{t.projectOverview}</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextDisplay
            className="mb-3"
            content={projectDescription || project.description || ""}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.startDate}</p>
              <p className="text-xl font-semibold">
                {project.timeline[0]?.startDate
                  ? format(project.timeline[0].startDate, "MMM yyyy")
                  : t.notSpecified}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.teamSize}</p>
              <p className="text-xl font-semibold">
                {project.teachers.length} {t.members}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.completion}</p>
              <p className="text-xl font-semibold">{completionPercentage}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.resources}</p>
              <p className="text-xl font-semibold">
                {project.quizzes.length} {t.quizzes}
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
                <CardTitle>{t.projectTimeline}</CardTitle>
                <CardDescription>{t.trackProgress}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {project.timeline.map((phase, index) => {
                    const phaseTitle = getLocalizedContent(
                      phase,
                      "title",
                      language
                    );
                    const phaseDescription = getLocalizedContent(
                      phase,
                      "description",
                      language
                    );

                    return (
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
                              <Badge variant="default">{t.completed}</Badge>
                            )}
                          </div>

                          <h3 className="text-xl font-semibold mb-2">
                            {phaseTitle || phase.title}
                          </h3>

                          <div className="mb-4">
                            <RichTextDisplay
                              content={
                                phaseDescription || phase.description || ""
                              }
                              className="text-muted-foreground prose-sm"
                            />
                          </div>

                          {/* Phase images - matching gallery style from project details page */}
                          {(phase.media ||
                            (phase.gallery && phase.gallery.length > 0)) && (
                            <div className="mt-4">
                              {(() => {
                                // Collect all images for this phase
                                const phaseImages = [
                                  // Include primary media (handle both array and single object forms)
                                  ...(phase.media
                                    ? Array.isArray(phase.media)
                                      ? phase.media
                                      : [
                                          {
                                            id:
                                              typeof phase.media === "object" &&
                                              phase.media !== null
                                                ? phase.media.id
                                                : `${phase.id}-media`,
                                            url:
                                              typeof phase.media === "object" &&
                                              phase.media !== null
                                                ? phase.media.url
                                                : "",
                                          },
                                        ].filter((img) => img.url) // Filter out empty URLs
                                    : []),
                                  // Include gallery images
                                  ...(phase.gallery || []),
                                ].filter((img) => img && img.url);

                                if (phaseImages.length === 0) return null;

                                // Format images for gallery
                                const galleryImages = phaseImages.map(
                                  (img) => ({
                                    id: img.id,
                                    url: img.url,
                                    alt: phaseTitle || phase.title,
                                  })
                                );

                                // If only 1 image, display a simple thumbnail
                                if (phaseImages.length === 1) {
                                  return (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <div className="group relative aspect-square w-40 rounded-md overflow-hidden bg-muted cursor-pointer">
                                          <Image
                                            src={phaseImages[0].url}
                                            alt={phaseTitle || phase.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 160px"
                                            className="object-cover transition-transform group-hover:scale-105"
                                            loading="lazy"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Expand className="w-6 h-6 text-white" />
                                          </div>
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl">
                                        <div className="py-1">
                                          <h3 className="text-lg font-medium">
                                            {phaseTitle || phase.title}
                                          </h3>
                                        </div>
                                        <Carousel className="w-full">
                                          <CarouselContent>
                                            {galleryImages.map((img) => (
                                              <CarouselItem key={img.id}>
                                                <div className="relative h-[60vh] max-h-[600px] w-full">
                                                  <Image
                                                    src={img.url}
                                                    alt={
                                                      img.alt || "Project image"
                                                    }
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 80vw"
                                                    className="object-contain"
                                                  />
                                                </div>
                                              </CarouselItem>
                                            ))}
                                          </CarouselContent>
                                          <CarouselPrevious />
                                          <CarouselNext />
                                        </Carousel>
                                      </DialogContent>
                                    </Dialog>
                                  );
                                }

                                // For multiple images, use a grid of thumbnails
                                return (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-w-xl">
                                    {phaseImages
                                      .slice(0, 4)
                                      .map((image, index) => (
                                        <Dialog key={image.id}>
                                          <DialogTrigger asChild>
                                            <div className="group relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer">
                                              <Image
                                                src={image.url}
                                                alt={phaseTitle || phase.title}
                                                fill
                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                className="object-cover transition-transform group-hover:scale-105"
                                                loading="lazy"
                                              />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Expand className="w-6 h-6 text-white" />
                                              </div>

                                              {/* Show +X more on last visible thumbnail if needed */}
                                              {index === 3 &&
                                                phaseImages.length > 4 && (
                                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium">
                                                    +{phaseImages.length - 4}
                                                  </div>
                                                )}
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl">
                                            <div className="py-1">
                                              <h3 className="text-lg font-medium">
                                                {phaseTitle || phase.title}
                                              </h3>
                                            </div>
                                            <Carousel className="w-full">
                                              <CarouselContent>
                                                {galleryImages.map((img) => (
                                                  <CarouselItem key={img.id}>
                                                    <div className="relative h-[60vh] max-h-[600px] w-full">
                                                      <Image
                                                        src={img.url}
                                                        alt={
                                                          img.alt ||
                                                          "Project image"
                                                        }
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, 80vw"
                                                        className="object-contain"
                                                      />
                                                    </div>
                                                  </CarouselItem>
                                                ))}
                                              </CarouselContent>
                                              <CarouselPrevious />
                                              <CarouselNext />
                                            </Carousel>
                                          </DialogContent>
                                        </Dialog>
                                      ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Teachers */}
          {project.teachers.length > 0 && (
            <ProjectTeam teachers={project.teachers} language={language} />
          )}

          {/* Combined Gallery - optimized version */}
          {allProjectImages.length > 0 && (
            <GalleryView
              images={allProjectImages}
              title={t.projectGallery}
              columns={4} // We now handle responsive columns inside the component
            />
          )}
          {/* Resources */}
          {project.quizzes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" />
                  {t.learningResources}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.quizzes.map((quiz) => {
                    const quizTitle = getLocalizedContent(
                      quiz,
                      "title",
                      language
                    );
                    const quizDescription = getLocalizedContent(
                      quiz,
                      "description",
                      language
                    );

                    return (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {quizTitle || quiz.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {quizDescription || quiz.description || t.takeQuiz}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`${prefix}/quizzes/${quiz.id}`}>
                            {t.startQuiz}
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}

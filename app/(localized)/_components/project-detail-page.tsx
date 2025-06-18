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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    startDate: Date | null;
    endDate: Date | null;
    completed: boolean;
    order: number;
    activities?: {
      id: string;
      title: string;
      title_sl?: string | null;
      title_hr?: string | null;
      description: string;
      description_sl?: string | null;
      description_hr?: string | null;
      order: number;
      teachers?: {
        teacher: {
          id: string;
          name: string;
        };
      }[];
      images?: {
        media: {
          id: string;
          url: string;
        };
      }[];
    }[];
  }[];
}

interface ProjectDetailPageProps {
  project: Project;
  language: SupportedLanguage;
}

// Helper function for Slavic pluralization
const getSlavicPlural = (
  count: number,
  singular: string,
  dual: string,
  plural: string,
  genitive: string
) => {
  if (count === 1) return singular;
  if (count === 2) return dual;
  if (count === 3 || count === 4) return plural;
  return genitive;
};

// Helper function for Croatian pluralization
const getCroatianPlural = (
  count: number,
  singular: string,
  paucal: string,
  plural: string
) => {
  if (count === 1) return singular;
  if (count >= 2 && count <= 4) return paucal;
  return plural;
};

// Helper function to get localized count text
const getLocalizedCount = (
  count: number,
  type: "teacher" | "image",
  language: SupportedLanguage
) => {
  if (language === "en") {
    if (type === "teacher") return count === 1 ? "teacher" : "teachers";
    return count === 1 ? "image" : "images";
  }

  if (language === "sl") {
    if (type === "teacher") {
      return getSlavicPlural(
        count,
        "učitelj",
        "učitelja",
        "učitelji",
        "učiteljev"
      );
    }
    return getSlavicPlural(count, "slika", "sliki", "slike", "slik");
  }

  if (language === "hr") {
    if (type === "teacher") {
      return getCroatianPlural(count, "nastavnik", "nastavnika", "nastavnika");
    }
    return getCroatianPlural(count, "slika", "slike", "slika");
  }

  return "";
};

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
      projectTimeline: "Project activities",
      trackProgress: "Track the project's progress and milestones",
      completed: "Completed",
      learningResources: "Learning Resources",
      takeQuiz: "Take this quiz to test your knowledge",
      startQuiz: "Start Quiz",
      projectGallery: "Project Gallery",
      // Activity accordion translations
      assignedTeachers: "Assigned Teachers",
      activityGallery: "Activity Gallery",
      gallery: "Gallery",
      noActivityDetails: "No additional details available for this activity.",
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
      projectTimeline: "Aktivnosti projekta",
      trackProgress: "Sledite napredku in mejnikom projekta",
      completed: "Končano",
      learningResources: "Učni viri",
      takeQuiz: "Rešite ta kviz, da preverite svoje znanje",
      startQuiz: "Začni kviz",
      projectGallery: "Galerija projekta",
      // Activity accordion translations
      assignedTeachers: "Dodeljeni učitelji",
      activityGallery: "Galerija aktivnosti",
      gallery: "Galerija",
      noActivityDetails: "Za to aktivnost ni na voljo dodatnih podrobnosti.",
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
      projectTimeline: "Aktivnosti projekta",
      trackProgress: "Pratite napredak i prekretnice projekta",
      completed: "Završeno",
      learningResources: "Obrazovni resursi",
      takeQuiz: "Riješite ovaj kviz da testirate svoje znanje",
      startQuiz: "Započni kviz",
      projectGallery: "Galerija projekta",
      // Activity accordion translations
      assignedTeachers: "Dodijeljeni nastavnici",
      activityGallery: "Galerija aktivnosti",
      gallery: "Galerija",
      noActivityDetails: "Nema dodatnih detalja dostupnih za ovu aktivnost.",
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

  // Project gallery - only actual gallery images (not activity images)
  const projectGalleryImages: GalleryImage[] = (project.gallery || []).map(
    (img) => ({
      id: img.id,
      url: img.url,
      alt: projectName || project.name,
    })
  );

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

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight break-words">
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
            className="mb-3 break-words overflow-hidden"
            content={projectDescription || project.description || ""}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground break-words">
                {t.startDate}
              </p>
              <p className="text-lg sm:text-xl font-semibold break-words">
                {project.timeline[0]?.startDate
                  ? format(project.timeline[0].startDate, "MMM yyyy")
                  : t.notSpecified}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground break-words">
                {t.teamSize}
              </p>
              <p className="text-lg sm:text-xl font-semibold break-words">
                {project.teachers.length} {t.members}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground break-words">
                {t.completion}
              </p>
              <p className="text-lg sm:text-xl font-semibold">
                {completionPercentage}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground break-words">
                {t.resources}
              </p>
              <p className="text-lg sm:text-xl font-semibold break-words">
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

                          <h3 className="text-xl font-semibold mb-5">
                            {phaseTitle || phase.title}
                          </h3>
                          {/* Activities */}
                          {phase.activities && phase.activities.length > 0 && (
                            <div className="mb-6">
                              <Accordion type="multiple" className="space-y-3">
                                {phase.activities.map((activity, index) => {
                                  const activityTitle = getLocalizedContent(
                                    activity,
                                    "title",
                                    language
                                  );
                                  const activityDescription =
                                    getLocalizedContent(
                                      activity,
                                      "description",
                                      language
                                    );

                                  return (
                                    <AccordionItem
                                      key={activity.id}
                                      value={`activity-${activity.id}`}
                                      className="border border-border/60 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
                                    >
                                      <AccordionTrigger className="px-4 sm:px-6 py-4 hover:no-underline group">
                                        <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0">
                                          {/* Activity Number Badge */}
                                          <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-xs sm:text-sm font-semibold">
                                            {index + 1}
                                          </div>

                                          <div className="text-left flex-1 min-w-0">
                                            <h5 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors break-words">
                                              {activityTitle || activity.title}
                                            </h5>

                                            {/* Info badges */}
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                                              {activity.teachers &&
                                                activity.teachers.length >
                                                  0 && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 whitespace-nowrap"
                                                  >
                                                    👥{" "}
                                                    {activity.teachers.length}{" "}
                                                    {getLocalizedCount(
                                                      activity.teachers.length,
                                                      "teacher",
                                                      language
                                                    )}
                                                  </Badge>
                                                )}
                                              {activity.images &&
                                                activity.images.length > 0 && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 whitespace-nowrap"
                                                  >
                                                    🖼️ {activity.images.length}{" "}
                                                    {getLocalizedCount(
                                                      activity.images.length,
                                                      "image",
                                                      language
                                                    )}
                                                  </Badge>
                                                )}
                                            </div>
                                          </div>
                                        </div>
                                      </AccordionTrigger>

                                      <AccordionContent className="px-4 sm:px-6 pb-6">
                                        <div className="space-y-6 mt-2">
                                          {/* Full Description */}
                                          <div className="prose prose-sm max-w-none text-muted-foreground">
                                            <RichTextDisplay
                                              content={
                                                activityDescription ||
                                                activity.description
                                              }
                                              className="text-sm leading-relaxed"
                                            />
                                          </div>

                                          {/* Teachers Section */}
                                          {activity.teachers &&
                                            activity.teachers.length > 0 && (
                                              <div className="bg-muted/30 rounded-lg p-4">
                                                <h6 className="font-medium mb-3 text-sm text-foreground flex items-center gap-2">
                                                  👥 {t.assignedTeachers}
                                                </h6>
                                                <div className="flex flex-wrap gap-2">
                                                  {activity.teachers.map(
                                                    (teacherRel) => (
                                                      <Badge
                                                        key={
                                                          teacherRel.teacher.id
                                                        }
                                                        variant="secondary"
                                                        className="text-sm px-3 py-1.5 font-medium break-words"
                                                      >
                                                        {
                                                          teacherRel.teacher
                                                            .name
                                                        }
                                                      </Badge>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                          {/* Images Gallery */}
                                          {activity.images &&
                                            activity.images.length > 0 && (
                                              <div className="bg-muted/30 rounded-lg p-4">
                                                <h6 className="font-medium mb-4 text-sm text-foreground flex items-center gap-2">
                                                  🖼️ {t.activityGallery}
                                                </h6>

                                                {activity.images.length ===
                                                1 ? (
                                                  // Single image - larger display
                                                  <Dialog>
                                                    <DialogTrigger asChild>
                                                      <div className="group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer max-w-md">
                                                        <Image
                                                          src={
                                                            activity.images[0]
                                                              .media.url
                                                          }
                                                          alt={
                                                            activityTitle ||
                                                            activity.title
                                                          }
                                                          fill
                                                          sizes="(max-width: 768px) 100vw, 400px"
                                                          className="object-cover transition-transform group-hover:scale-105"
                                                          loading="lazy"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                          <Expand className="w-6 h-6 text-white" />
                                                        </div>
                                                      </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl">
                                                      <DialogHeader>
                                                        <DialogTitle>
                                                          {activityTitle ||
                                                            activity.title}
                                                        </DialogTitle>
                                                      </DialogHeader>
                                                      <div className="relative h-[70vh] max-h-[600px] w-full">
                                                        <Image
                                                          src={
                                                            activity.images[0]
                                                              .media.url
                                                          }
                                                          alt={
                                                            activityTitle ||
                                                            activity.title
                                                          }
                                                          fill
                                                          sizes="(max-width: 768px) 100vw, 80vw"
                                                          className="object-contain"
                                                        />
                                                      </div>
                                                    </DialogContent>
                                                  </Dialog>
                                                ) : (
                                                  // Multiple images - grid with carousel dialog
                                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                                                    {activity.images.map(
                                                      (imageRel, imgIndex) => (
                                                        <Dialog
                                                          key={
                                                            imageRel.media.id
                                                          }
                                                        >
                                                          <DialogTrigger
                                                            asChild
                                                          >
                                                            <div className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer">
                                                              <Image
                                                                src={
                                                                  imageRel.media
                                                                    .url
                                                                }
                                                                alt={`${activityTitle || activity.title} - Image ${imgIndex + 1}`}
                                                                fill
                                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                                className="object-cover transition-transform group-hover:scale-105"
                                                                loading="lazy"
                                                              />
                                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Expand className="w-5 h-5 text-white" />
                                                              </div>
                                                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                                {imgIndex + 1}/
                                                                {
                                                                  activity
                                                                    .images!
                                                                    .length
                                                                }
                                                              </div>
                                                            </div>
                                                          </DialogTrigger>
                                                          <DialogContent className="max-w-6xl">
                                                            <DialogHeader>
                                                              <DialogTitle>
                                                                {activityTitle ||
                                                                  activity.title}{" "}
                                                                - {t.gallery}
                                                              </DialogTitle>
                                                            </DialogHeader>
                                                            <Carousel className="w-full">
                                                              <CarouselContent>
                                                                {activity.images!.map(
                                                                  (img) => (
                                                                    <CarouselItem
                                                                      key={
                                                                        img
                                                                          .media
                                                                          .id
                                                                      }
                                                                    >
                                                                      <div className="relative h-[70vh] max-h-[700px] w-full">
                                                                        <Image
                                                                          src={
                                                                            img
                                                                              .media
                                                                              .url
                                                                          }
                                                                          alt={
                                                                            activityTitle ||
                                                                            activity.title
                                                                          }
                                                                          fill
                                                                          sizes="(max-width: 768px) 100vw, 90vw"
                                                                          className="object-contain"
                                                                        />
                                                                      </div>
                                                                    </CarouselItem>
                                                                  )
                                                                )}
                                                              </CarouselContent>
                                                              <CarouselPrevious />
                                                              <CarouselNext />
                                                            </Carousel>
                                                          </DialogContent>
                                                        </Dialog>
                                                      )
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                          {/* Empty state */}
                                          {(!activity.teachers ||
                                            activity.teachers.length === 0) &&
                                            (!activity.images ||
                                              activity.images.length === 0) && (
                                              <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                                                <p className="text-sm">
                                                  {t.noActivityDetails}
                                                </p>
                                              </div>
                                            )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  );
                                })}
                              </Accordion>
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

          {/* Project Gallery - only actual gallery images */}
          {projectGalleryImages.length > 0 && (
            <GalleryView
              images={projectGalleryImages}
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
                        className="flex items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-medium break-words">
                            {quizTitle || quiz.title}
                          </p>
                          <p className="text-sm text-muted-foreground break-words">
                            {quizDescription || quiz.description || t.takeQuiz}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-shrink-0"
                        >
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

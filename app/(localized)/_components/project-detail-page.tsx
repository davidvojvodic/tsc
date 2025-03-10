"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BrainCircuit, ArrowLeft, Calendar, Expand } from "lucide-react";
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
import { getLocalizedContent } from "@/lib/language-utils";
import { SupportedLanguage } from "@/store/language-context";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";

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
    media: {
      url: string;
    } | null;
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

  return (
    <Container>
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] w-full mb-10 rounded-xl overflow-hidden">
        {project.heroImage ? (
          <Image
            src={project.heroImage.url}
            alt={projectName || project.name}
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
            <Link href={`${prefix}/projects`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.backToProjects}
            </Link>
          </Button>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            {projectName || project.name}
          </h1>
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
                          <p className="text-muted-foreground mb-4">
                            {phaseDescription || phase.description}
                          </p>

                          {phase.media && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="relative h-[200px] w-full sm:w-[300px] rounded-lg overflow-hidden cursor-pointer group">
                                  <Image
                                    src={phase.media.url}
                                    alt={phaseTitle || phase.title}
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
                                  <DialogTitle>
                                    {phaseTitle || phase.title}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="relative h-[600px] w-full">
                                  <Image
                                    src={phase.media.url}
                                    alt={phaseTitle || phase.title}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
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

          {/* Gallery */}
          {project.gallery.length > 0 && (
            <GalleryView
              images={project.gallery.map((img) => ({
                id: img.id,
                url: img.url,
                alt: null,
              }))}
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

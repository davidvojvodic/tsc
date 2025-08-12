"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupportedLanguage } from "@/store/language-context";
import { Teacher } from "@/lib/types";
import { RichTextDisplay } from "@/components/rich-text-content";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  featured: boolean;
  published: boolean;
  heroImage: {
    url: string;
  } | null;
  tags: {
    id: string;
    name: string;
  }[];
  teachers: Teacher[];
  timeline: {
    startDate: Date | null;
    completed: boolean;
  }[];
}

interface ProjectsPageProps {
  projects: Project[];
  language: SupportedLanguage;
}

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      title: "Our Projects",
      description:
        "Discover our innovative projects and initiatives that are making a difference in our community and beyond.",
      featuredProjects: "Featured Projects",
      viewProject: "View Project",
      allProjects: "All Projects",
      started: "Started",
      teamMembers: (count: number) =>
        count === 1 ? "Team Member" : "Team Members",
    },
    sl: {
      title: "Naši projekti",
      description:
        "Odkrijte naše inovativne projekte in pobude, ki spreminjajo našo skupnost in širše.",
      featuredProjects: "Izpostavljeni projekti",
      viewProject: "Ogled projekta",
      allProjects: "Vsi projekti",
      started: "Začetek",
      teamMembers: (count: number) => {
        if (count === 1) return "Član ekipe";
        else if (count === 2) return "Člana ekipe";
        else if (count === 3 || count === 4) return "Člani ekipe";
        else return "Članov ekipe";
      },
    },
    hr: {
      title: "Naši projekti",
      description:
        "Otkrijte naše inovativne projekte i inicijative koje čine razliku u našoj zajednici i šire.",
      featuredProjects: "Istaknuti projekti",
      viewProject: "Pogledaj projekt",
      allProjects: "Svi projekti",
      started: "Započeto",
      teamMembers: (count: number) => {
        if (count === 1) return "Član tima";
        else if (count === 2) return "Člana tima";
        else if (count === 3 || count === 4) return "Člana tima";
        else return "Članova tima";
      },
    },
  };

  return translations[language];
};

export function ProjectsPage({ projects, language }: ProjectsPageProps) {
  const t = getTranslations(language);
  const categories = [
    ...new Set(projects.flatMap((p) => p.tags.map((t) => t.name))),
  ];

  const prefix = language === "en" ? "" : `/${language}`;

  return (
    <Container>
      <div className="py-16 md:py-24">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        {/* Featured Projects */}
        {projects.find((p) => p.featured) && (
          <div className="mb-24 space-y-8">
            <h2 className="text-2xl font-semibold">{t.featuredProjects}</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {projects
                .filter((p) => p.featured)
                .map((project) => (
                  <Card
                    key={project.id}
                    className="group overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {project.heroImage && (
                      <div className="relative h-[350px] w-full overflow-hidden">
                        <Image
                          src={project.heroImage.url}
                          alt={project.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="bg-primary text-primary-foreground font-medium shadow-md"
                          >
                            {language === "en"
                              ? "Featured"
                              : language === "sl"
                                ? "Izpostavljeno"
                                : "Istaknuto"}
                          </Badge>

                          <div className="flex gap-2">
                            {project.tags?.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="outline"
                                className="bg-background/60 backdrop-blur-sm shadow-sm"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 px-2">
                          <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">
                            {project.name}
                          </h3>
                        </div>
                      </div>
                    )}
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
                        {project.timeline[0]?.startDate && (
                          <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {t.started}{" "}
                              {new Date(
                                project.timeline[0].startDate
                              ).toLocaleDateString(
                                language === "en"
                                  ? "en-US"
                                  : language === "sl"
                                    ? "sl-SI"
                                    : "hr-HR"
                              )}
                            </span>
                          </div>
                        )}
                        {project.teachers.length > 0 && (
                          <div className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                            <Users className="h-4 w-4" />
                            <span>
                              {project.teachers.length}{" "}
                              {t.teamMembers(project.teachers.length)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-muted-foreground mb-5 prose prose-sm">
                        {project.description && (
                          <RichTextDisplay
                            content={project.description}
                            className="line-clamp-2 h-[4rem]"
                          />
                        )}
                      </div>

                      <Button asChild className="w-full group">
                        <Link
                          href={`${prefix}/projects/${project.slug}`}
                          className="flex justify-center items-center"
                        >
                          <span>{t.viewProject}</span>
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
              <TabsTrigger value="all">{t.allProjects}</TabsTrigger>
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
                    <Card
                      key={project.id}
                      className="group overflow-hidden border shadow hover:shadow-md transition-all duration-300"
                    >
                      {project.heroImage && (
                        <div className="relative h-48 w-full overflow-hidden bg-muted">
                          <Image
                            src={project.heroImage.url}
                            alt={project.name}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                          {project.tags?.length > 0 && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              {project.tags.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="secondary"
                                  className="text-xs bg-background/80 backdrop-blur-sm shadow-sm"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          {project.timeline[0]?.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(
                                project.timeline[0].startDate
                              ).toLocaleDateString(
                                language === "en"
                                  ? "en-US"
                                  : language === "sl"
                                    ? "sl-SI"
                                    : "hr-HR"
                              )}
                            </div>
                          )}
                          {project.teachers.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>
                                {project.teachers.length}{" "}
                                {t.teamMembers(project.teachers.length)}
                              </span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                          {project.name}
                        </h3>
                        <div className="mb-3">
                          {project.description && (
                            <RichTextDisplay
                              content={project.description}
                              className="text-sm text-muted-foreground line-clamp-2 h-[2.75rem]"
                            />
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 pb-4 px-5">
                        <Button
                          asChild
                          variant="link"
                          className="p-0 bg-white h-auto text-primary font-medium group-hover:text-primary/80"
                        >
                          <Link
                            href={`${prefix}/projects/${project.slug}`}
                            className="flex items-center"
                          >
                            <span>{t.viewProject}</span>
                            <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Container>
  );
}

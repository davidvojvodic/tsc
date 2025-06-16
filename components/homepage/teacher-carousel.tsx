"use client";
import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Container } from "@/components/container";
import Image from "next/image";
import { TeacherDialog } from "../teacher-dialog";
import { useLanguage } from "@/store/language-context";
import { getLocalizedContent } from "@/lib/language-utils";
import { Teacher } from "@/lib/types";
import AutoScroll from "embla-carousel-auto-scroll";

interface TeacherCarouselProps {
  teachers: Teacher[];
}

export default function TeacherCarousel({ teachers }: TeacherCarouselProps) {
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(
    null
  );
  const [open, setOpen] = React.useState(false);
  const [loadedImages, setLoadedImages] = React.useState<Set<string>>(
    new Set()
  );
  const { language } = useLanguage();
  const [key, setKey] = React.useState(0);

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setOpen(true);
  };

  const handleImageLoad = (teacherId: string) => {
    setLoadedImages((prev) => new Set(prev).add(teacherId));
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setKey((prev) => prev + 1);
    }
  };

  if (!teachers.length) {
    return null;
  }

  // Sort teachers by displayOrder
  const sortedTeachers = [...teachers].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );

  // Separate teachers by school
  const tscTeachers = sortedTeachers.filter(
    (teacher) => !teacher.school || teacher.school === "tsc"
  );
  const ptsTeachers = sortedTeachers.filter(
    (teacher) => teacher.school === "pts"
  );

  // Render a teacher carousel section
  const renderTeacherCarousel = (
    schoolTeachers: Teacher[],
    isReverse: boolean = false
  ) => {
    if (schoolTeachers.length === 0) return null;

    return (
      <div className="space-y-8 mb-12">
        <div className="relative">
          {/* Left gradient overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10" />
          {/* Right gradient overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10" />
          <Carousel
            key={key}
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 1,
            }}
            plugins={[
              AutoScroll({
                speed: 0.5,
                direction: isReverse ? "backward" : "forward",
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {schoolTeachers.map((teacher) => {
                const title = getLocalizedContent(teacher, "title", language);
                const bio = getLocalizedContent(teacher, "bio", language);

                return (
                  <CarouselItem
                    key={teacher.id}
                    className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4"
                  >
                    <Card
                      className="overflow-hidden cursor-pointer transition-colors hover:bg-muted/50 md:h-[456px]"
                      onClick={() => handleTeacherClick(teacher)}
                    >
                      <div className="p-6">
                        <AspectRatio
                          ratio={1 / 1}
                          className="overflow-hidden rounded-lg bg-muted"
                        >
                          {teacher.photo ? (
                            <Image
                              src={teacher.photo.url}
                              alt={teacher.name}
                              fill
                              className={`object-cover w-full h-full transition-opacity duration-300 ${
                                loadedImages.has(teacher.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              priority={schoolTeachers.indexOf(teacher) < 4}
                              onLoad={() => handleImageLoad(teacher.id)}
                              loading={
                                schoolTeachers.indexOf(teacher) < 4
                                  ? "eager"
                                  : "lazy"
                              }
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <span className="text-4xl font-semibold text-muted-foreground">
                                {teacher.name[0]}
                              </span>
                            </div>
                          )}
                        </AspectRatio>
                      </div>
                      <CardHeader className="px-6 pb-2 pt-0">
                        <CardTitle className="text-xl">
                          {teacher.name}
                        </CardTitle>
                        <CardDescription>
                          {title || (
                            <>
                              {language === "en" && "Teacher"}
                              {language === "sl" && "Učitelj"}
                              {language === "hr" && "Učitelj"}
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-6">
                        <p className="text-muted-foreground line-clamp-3">
                          {bio || (
                            <>
                              {language === "en" && "No bio available"}
                              {language === "sl" && "Biografija ni na voljo"}
                              {language === "hr" && "Životopis nije dostupan"}
                            </>
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    );
  };

  // Remove the school-specific titles and descriptions

  return (
    <>
      <div className="w-full py-16 bg-muted/50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {language === "en" && "Meet Our Teachers"}
              {language === "sl" && "Spoznajte naše učitelje"}
              {language === "hr" && "Upoznajte naše učitelje"}
            </h2>
          </div>

          {/* TSC Teachers Carousel */}
          {renderTeacherCarousel(tscTeachers)}

          {/* PTS Teachers Carousel */}
          {renderTeacherCarousel(ptsTeachers, true)}
        </Container>
      </div>
      <TeacherDialog
        teacher={selectedTeacher as Teacher}
        open={open}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}

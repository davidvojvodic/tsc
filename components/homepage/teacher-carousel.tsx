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

interface Teacher {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo: { url: string } | null;
  createdAt?: Date;
  email?: string | null;
}

interface TeacherCarouselProps {
  teachers: Teacher[];
}

export default function TeacherCarousel({ teachers }: TeacherCarouselProps) {
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(
    null
  );
  const [open, setOpen] = React.useState(false);

  if (!teachers.length) {
    return null;
  }

  const handleTeacherClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setOpen(true);
  };

  return (
    <>
      <div className="w-full py-16 bg-muted/50">
        <Container>
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Meet Our Teachers
              </h2>
              <p className="text-muted-foreground mt-2">
                Learn from our experienced educators
              </p>
            </div>

            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  slidesToScroll: 1,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {teachers.map((teacher) => (
                    <CarouselItem
                      key={teacher.id}
                      className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4"
                    >
                      <Card
                        className="overflow-hidden cursor-pointer transition-colors hover:bg-muted/50"
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
                                className="object-cover w-full h-full"
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
                            {teacher.title || "Teacher"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-6">
                          <p className="text-muted-foreground line-clamp-3">
                            {teacher.bio || "No bio available"}
                          </p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>
        </Container>
      </div>

      <TeacherDialog
        teacher={selectedTeacher}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

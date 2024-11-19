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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Calendar, Mail } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

interface Teacher {
  id: string;
  name: string;
  bio: string | null;
  photo: { url: string } | null;
  createdAt?: Date;
  email?: string;
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
                          <CardDescription>Teacher</CardDescription>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
          {selectedTeacher && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedTeacher.name}
                </DialogTitle>
                <DialogDescription>Teacher Profile</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 mt-4">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-[240px] max-w-[240px] mx-auto sm:mx-0">
                    <AspectRatio
                      ratio={1 / 1}
                      className="overflow-hidden rounded-lg bg-muted"
                    >
                      {selectedTeacher.photo ? (
                        <Image
                          src={selectedTeacher.photo.url}
                          alt={selectedTeacher.name}
                          fill
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-4xl font-semibold text-muted-foreground">
                            {selectedTeacher.name[0]}
                          </span>
                        </div>
                      )}
                    </AspectRatio>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">About</h3>
                      <p className="text-muted-foreground text-justify">
                        {selectedTeacher.bio || "No bio available"}
                      </p>
                    </div>

                    {(selectedTeacher.email || selectedTeacher.createdAt) && (
                      <div className="flex flex-col gap-2 text-sm">
                        {selectedTeacher.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="break-all">
                              {selectedTeacher.email}
                            </span>
                          </div>
                        )}
                        {selectedTeacher.createdAt && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Joined{" "}
                              {format(
                                new Date(selectedTeacher.createdAt),
                                "MMMM yyyy"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

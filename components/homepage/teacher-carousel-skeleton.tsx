import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Container } from "@/components/container";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Loader } from "lucide-react";

export default function TeacherCarouselSkeleton() {
  return (
    <div className="w-full py-16 bg-muted/50">
      <Container>
        <div className="space-y-8">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded-md mt-2" />
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {[...Array(4)].map((_, index) => (
                <CarouselItem
                  key={index}
                  className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4"
                >
                  <Card className="overflow-hidden">
                    <div className="p-6">
                      <AspectRatio
                        ratio={1 / 1}
                        className="overflow-hidden rounded-lg bg-muted animate-pulse"
                      >
                        <Loader className="h-full w-full" />
                      </AspectRatio>
                    </div>
                    <CardHeader className="px-6 pb-2 pt-0">
                      <div className="h-6 w-32 bg-muted animate-pulse rounded-md" />
                      <div className="h-4 w-24 bg-muted animate-pulse rounded-md mt-2" />
                    </CardHeader>
                    <CardContent className="px-6">
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </Container>
    </div>
  );
}

// components/project/gallery-view.tsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
}

interface GalleryViewProps {
  images: GalleryImage[];
}

export function GalleryView({ images }: GalleryViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (api) {
      api.scrollTo(selectedIndex);
    }
  }, [api, selectedIndex]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Gallery</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <Dialog key={image.id}>
              <DialogTrigger asChild>
                <div
                  className="group relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setSelectedIndex(index)}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || "Project image"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Expand className="w-6 h-6 text-white" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <Carousel setApi={setApi} className="w-full">
                  <CarouselContent>
                    {images.map((img) => (
                      <CarouselItem key={img.id}>
                        <div className="relative h-[600px] w-full">
                          <Image
                            src={img.url}
                            alt={img.alt || "Project image"}
                            fill
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
      </CardContent>
    </Card>
  );
}

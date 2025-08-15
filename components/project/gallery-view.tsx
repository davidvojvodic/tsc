// components/project/gallery-view.tsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Expand, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogVisuallyHidden } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
  phaseId?: string;
  phaseTitle?: string;
}

interface GalleryViewProps {
  images: GalleryImage[];
  title?: string;
  showAsCard?: boolean;
  initialIndex?: number;
  columns?: number;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  initialIndex?: number;
  setSelectedIndex: (index: number) => void;
}

// Main Gallery component
export function GalleryView({
  images,
  title = "Project Gallery",
  showAsCard = true,
  initialIndex = 0,
}: GalleryViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Group images by phase if they have phaseId
  const groupedByPhase = images.reduce(
    (acc, image) => {
      if (image.phaseId) {
        if (!acc.byPhase[image.phaseId]) {
          acc.byPhase[image.phaseId] = {
            phaseTitle: image.phaseTitle || "Project Phase",
            images: [],
          };
        }
        acc.byPhase[image.phaseId].images.push(image);
      } else {
        acc.regular.push(image);
      }
      return acc;
    },
    {
      byPhase: {} as Record<
        string,
        { phaseTitle: string; images: GalleryImage[] }
      >,
      regular: [] as GalleryImage[],
    }
  );

  // Flatten and optimize gallery list - limit to a smaller number when there are many images
  const hasPhaseImages = Object.keys(groupedByPhase.byPhase).length > 0;
  const maxRegularImages = hasPhaseImages ? 6 : 12; // Show fewer regular images if we have phase images

  // Trim the regular list if needed
  const displayRegularImages = groupedByPhase.regular.slice(
    0,
    maxRegularImages
  );
  const hasMoreRegular = groupedByPhase.regular.length > maxRegularImages;

  // Prepare the final list of images/thumbnails to display
  const allImages = [...images]; // Keep full list for the carousel

  const content = (
    <div className="space-y-6">
      {/* Regular gallery images - with responsive grid */}
      {displayRegularImages.length > 0 && (
        <div>
          {hasPhaseImages && (
            <h3 className="text-sm font-medium mb-2">General Project Images</h3>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayRegularImages.map((image) => (
              <GalleryImageThumbnail
                key={image.id}
                image={image}
                index={images.findIndex((img) => img.id === image.id)}
                images={allImages}
                setSelectedIndex={setSelectedIndex}
              />
            ))}
            {hasMoreRegular && (
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative aspect-square rounded-md overflow-hidden bg-muted/60 cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:bg-muted">
                    <ImageIcon className="h-8 w-8 mb-1" />
                    <p className="text-sm font-medium">
                      +{groupedByPhase.regular.length - maxRegularImages} more
                    </p>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogVisuallyHidden>
                    <DialogTitle>Image Gallery - View More Images</DialogTitle>
                  </DialogVisuallyHidden>
                  <ImageGallery
                    images={allImages}
                    initialIndex={maxRegularImages}
                    setSelectedIndex={setSelectedIndex}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      )}

      {/* Phase-grouped images */}
      {Object.entries(groupedByPhase.byPhase).length > 0 && (
        <div className="space-y-4">
          {hasPhaseImages && displayRegularImages.length > 0 && (
            <h3 className="text-sm font-medium mt-4 mb-2">Phase Images</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedByPhase.byPhase).map(
              ([phaseId, { phaseTitle, images }]) => (
                <div key={phaseId} className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    {phaseTitle}
                  </h4>
                  <PhaseGalleryThumbnail
                    images={images}
                    phaseTitle={phaseTitle}
                  />
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (!showAsCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

// Individual thumbnail with dialog
function GalleryImageThumbnail({
  image,
  index,
  images,
  setSelectedIndex,
}: {
  image: GalleryImage;
  index: number;
  images: GalleryImage[];
  setSelectedIndex: (index: number) => void;
}) {
  return (
    <Dialog>
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
        <DialogVisuallyHidden>
          <DialogTitle>Image Gallery - Full Size View</DialogTitle>
        </DialogVisuallyHidden>
        <ImageGallery
          images={images}
          initialIndex={index}
          setSelectedIndex={setSelectedIndex}
        />
      </DialogContent>
    </Dialog>
  );
}

// Carousel for the dialog
function ImageGallery({
  images,
  initialIndex = 0,
  setSelectedIndex,
}: ImageGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!api) return;

    api.scrollTo(initialIndex);
    setIsLoaded(true);

    const onSelect = () => {
      const index = api.selectedScrollSnap();
      setSelectedIndex(index);
      setCurrentImageIndex(index);
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, initialIndex, setSelectedIndex]);

  return (
    <div className="space-y-3">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={img.id}>
              <div className="relative h-[60vh] max-h-[600px] w-full">
                {/* Only load the current image and adjacent ones to improve performance */}
                {Math.abs(currentImageIndex - index) < 3 && (
                  <Image
                    src={img.url}
                    alt={img.alt || "Project image"}
                    fill
                    sizes="(max-width: 768px) 100vw, 80vw"
                    priority={index === currentImageIndex}
                    className="object-contain transition-opacity duration-300"
                    loading={index === currentImageIndex ? "eager" : "lazy"}
                    onLoad={() =>
                      index === currentImageIndex && setIsLoaded(true)
                    }
                  />
                )}
                {!isLoaded && index === currentImageIndex && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="animate-pulse h-8 w-8 rounded-full bg-muted-foreground/20"></div>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* Image info and counter */}
      <div className="flex justify-between items-center px-2">
        <div className="text-sm text-muted-foreground">
          {currentImageIndex + 1} / {images.length}
        </div>
        {images[currentImageIndex]?.phaseTitle && (
          <div className="text-sm font-medium bg-muted px-3 py-1 rounded-full">
            {images[currentImageIndex].phaseTitle}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for phases with multiple images
export function PhaseGalleryThumbnail({
  images,
  phaseTitle,
}: {
  images: GalleryImage[];
  phaseTitle: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images.length) return null;

  // If there are multiple images, show a grid
  if (images.length > 1) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
              {/* First image - larger */}
              <div className="relative aspect-square col-span-2 sm:col-span-1 sm:row-span-2 bg-muted">
                <Image
                  src={images[0].url}
                  alt={phaseTitle}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>

              {/* Show up to 3 more images in smaller cells */}
              {images.slice(1, 4).map((image, idx) => (
                <div key={image.id} className="relative aspect-square bg-muted">
                  <Image
                    src={image.url}
                    alt={`${phaseTitle} image ${idx + 2}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 16vw"
                    className="object-cover"
                    loading="lazy"
                  />
                  {/* If there are more images than we're showing, add a +X overlay on the last visible image */}
                  {idx === 2 && images.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium">
                      +{images.length - 4}
                    </div>
                  )}
                </div>
              ))}

              {/* If we have less than 3 additional images, fill with empty cells */}
              {images.length === 2 && (
                <div className="relative aspect-square bg-muted/30"></div>
              )}
            </div>

            {/* Phase title */}
            <div className="mt-1.5 text-xs font-medium truncate">
              {images.length} image{images.length !== 1 ? "s" : ""}
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogVisuallyHidden>
            <DialogTitle>Phase Gallery - Timeline Images</DialogTitle>
          </DialogVisuallyHidden>
          <ImageGallery
            images={images}
            initialIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // For a single image
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden cursor-pointer group">
          <Image
            src={images[0].url}
            alt={phaseTitle}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Expand className="w-6 h-6 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogVisuallyHidden>
          <DialogTitle>Project Gallery - All Images</DialogTitle>
        </DialogVisuallyHidden>
        <ImageGallery
          images={images}
          initialIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      </DialogContent>
    </Dialog>
  );
}

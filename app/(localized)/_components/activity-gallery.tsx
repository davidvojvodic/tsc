
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogVisuallyHidden, DialogHeader } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Expand } from "lucide-react";

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

interface OptimizedGalleryProps {
  images: GalleryImage[];
  title: string;
  maxVisible?: number;
}

export function OptimizedGallery({ images, title, maxVisible }: OptimizedGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const displayImages = maxVisible ? images.slice(0, maxVisible) : images;
  const remainingCount = images.length - displayImages.length;

  return (
    <>
      {/* Thumbnail Grid */}
      <div className={`grid gap-2 sm:gap-3 ${
        images.length === 1 
          ? "max-w-md" 
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      }`}>
        {displayImages.map((image, index) => {
          const isLastVisible = maxVisible && index === maxVisible - 1;
          const showOverlay = isLastVisible && remainingCount > 0;

          return (
            <div 
              key={image.id}
              className={`group relative rounded-lg overflow-hidden bg-muted cursor-pointer ${
                images.length === 1 ? "aspect-video" : "aspect-square"
              }`}
              onClick={() => {
                // If clicking the overlay, start at the first hidden image, 
                // otherwise start at the clicked image
                setInitialIndex(showOverlay ? maxVisible : index);
                setIsOpen(true);
              }}
            >
              <Image
                src={image.url}
                alt={image.alt || title || "Gallery Image"}
                fill
                quality={25}
                sizes={images.length === 1 
                  ? "(max-width: 768px) 100vw, 400px" 
                  : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                }
                className="object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Hover Zoom Icon (only if NOT showing count overlay) */}
              {!showOverlay && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Expand className="w-6 h-6 text-white" />
                </div>
              )}

              {/* +X More Overlay */}
              {showOverlay && (
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center group-hover:bg-black/70 transition-colors">
                    <span className="text-white text-xl font-medium">+{remainingCount}</span>
                 </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shared Dialog with Carousel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>{title} - Gallery</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            <OptimizedCarousel 
              images={images} 
              initialIndex={initialIndex} 
              title={title}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Separate component to handle carousel logic and optimization
function OptimizedCarousel({ 
  images, 
  initialIndex, 
  title 
}: { 
  images: GalleryImage[]; 
  initialIndex: number;
  title: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // Track loaded state for ALL images individually to handle pre-loading correctly
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!api) return;

    // Jump to initial index without animation on mount
    api.scrollTo(initialIndex, true);
    setCurrentIndex(initialIndex);

    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, initialIndex]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Carousel setApi={setApi} className="w-full flex-1 min-h-0 [&>div]:h-full">
        <CarouselContent className="h-full ml-0">
          {images.map((img, index) => {
             // Optimization: Only render the current image and its immediate neighbors (1 prev, 1 next)
             // Increased range to +/- 2 for smoother "fast" scrolling
             const shouldRender = Math.abs(currentIndex - index) <= 2;
             const isLoaded = loadedImages.has(index);

             return (
              <CarouselItem key={img.id} className="relative w-full h-full min-w-0 pl-4 basis-full">
                 {shouldRender ? (
                   <div className="relative w-full h-full flex items-center justify-center"> 
                      <Image
                        src={img.url}
                        alt={img.alt || title}
                        fill
                        quality={75}
                        priority={index === initialIndex} // Only priority for the one clicked
                        className="object-contain"
                        sizes="(max-width: 1280px) 100vw, 1200px"
                        onLoad={() => handleImageLoad(index)}
                      />
                      {/* Spinner for current image if not yet loaded */}
                      {!isLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                   </div>
                 ) : (
                    // Keep the container size even if empty to prevent carousel jumpiness
                   <div className="w-full h-full" />
                 )}
              </CarouselItem>
             );
          })}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
      
      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground mt-4 h-6">
         {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

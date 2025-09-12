import { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import Image from "next/image";
import { GripVertical, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ProjectImage } from "@/store/use-project-form";

export interface OrderedImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

interface ReorderableImageSelectorProps {
  galleryImages: ProjectImage[];
  selectedImages: OrderedImage[];
  onChange: (images: OrderedImage[]) => void;
  disabled?: boolean;
}

export function ReorderableImageSelector({
  galleryImages,
  selectedImages,
  onChange,
  disabled = false,
}: ReorderableImageSelectorProps) {
  const [isSelectingImages, setIsSelectingImages] = useState(false);

  const handleDragEnd = (result: { destination?: { index: number } | null; source: { index: number } }) => {
    if (!result.destination) return;

    const items = Array.from(selectedImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const reorderedImages = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    onChange(reorderedImages);
  };

  const handleImageToggle = (image: ProjectImage) => {
    const isSelected = selectedImages.some((selected) => selected.id === image.id);
    
    if (isSelected) {
      // Remove image and reorder remaining
      const filtered = selectedImages
        .filter((selected) => selected.id !== image.id)
        .map((item, index) => ({ ...item, order: index }));
      onChange(filtered);
    } else {
      // Add image with next order
      const newImage: OrderedImage = {
        id: image.id,
        url: image.url,
        alt: image.alt,
        order: selectedImages.length,
      };
      onChange([...selectedImages, newImage]);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const filtered = selectedImages
      .filter((selected) => selected.id !== imageId)
      .map((item, index) => ({ ...item, order: index }));
    onChange(filtered);
  };

  const availableImages = galleryImages.filter(
    (image) => !selectedImages.some((selected) => selected.id === image.id)
  );

  return (
    <div className="space-y-4">
      {/* Selected Images with Drag and Drop */}
      {selectedImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Images ({selectedImages.length})
            </h4>
            <Badge variant="outline" className="text-xs">
              Drag to reorder
            </Badge>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="selected-images" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                >
                  {selectedImages
                    .sort((a, b) => a.order - b.order)
                    .map((image, index) => (
                      <Draggable
                        key={image.id}
                        draggableId={image.id}
                        index={index}
                        isDragDisabled={disabled}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "relative group overflow-hidden",
                              snapshot.isDragging && "rotate-3 shadow-lg",
                              disabled && "opacity-50"
                            )}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-1 left-1 z-10 bg-background/80 backdrop-blur-sm rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-3 w-3" />
                            </div>

                            {/* Order Badge */}
                            <div className="absolute top-1 right-1 z-10">
                              <Badge
                                variant="secondary"
                                className="h-5 w-5 p-0 rounded-full text-xs flex items-center justify-center"
                              >
                                {index + 1}
                              </Badge>
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute bottom-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={() => handleRemoveImage(image.id)}
                              disabled={disabled}
                            >
                              <X className="h-3 w-3" />
                            </Button>

                            {/* Image */}
                            <div className="aspect-square relative">
                              <Image
                                src={image.url}
                                alt={image.alt || `Image ${index + 1}`}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Add Images Button */}
      {galleryImages.length > 0 && (
        <Popover open={isSelectingImages} onOpenChange={setIsSelectingImages}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full"
              disabled={disabled || availableImages.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              {selectedImages.length === 0
                ? "Select images from gallery"
                : availableImages.length === 0
                  ? "All images selected"
                  : "Add more images"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="max-h-60 overflow-y-auto p-2">
              {availableImages.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  All images have been selected
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableImages.map((image, index) => (
                    <div
                      key={image.id}
                      onClick={() => {
                        handleImageToggle(image);
                        if (availableImages.length === 1) {
                          setIsSelectingImages(false);
                        }
                      }}
                      className="relative cursor-pointer select-none rounded-sm p-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={false} className="mr-2" />
                        <div className="relative h-16 w-16 rounded overflow-hidden">
                          <Image
                            src={image.url}
                            alt={image.alt || `Gallery Image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-xs">Image {index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* No Images Available */}
      {galleryImages.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
          No images available. Upload images in the Gallery step first.
        </p>
      )}
    </div>
  );
}
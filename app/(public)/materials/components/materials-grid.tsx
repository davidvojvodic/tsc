"use client";

import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, File } from "lucide-react";
import { toast } from "sonner";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  size: number;
  downloads: number;
  category: string | null;
  filename: string;
}

export function MaterialsGrid({ materials }: { materials: Material[] }) {
  
  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No materials found. Try adjusting your filters.
        </p>
      </div>
    );
  }

  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await fetch(`/api/materials/${id}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Download started");
    } catch (error) {
      console.error("[MATERIAL_DOWNLOAD]", error);
      toast.error("Download failed");
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {materials.map((material) => (
        <Card key={material.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="line-clamp-2">{material.title}</CardTitle>
            {material.category && (
              <Badge variant="secondary" className="w-fit">
                {material.category}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {material.description && (
              <CardDescription className="line-clamp-2 mb-4">
                {material.description}
              </CardDescription>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <File className="mr-2 h-4 w-4" />
                <span>{formatBytes(material.size)}</span>
              </div>
              <div>{material.downloads} downloads</div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto pt-6">
            <Button
              className="w-full"
              onClick={() => handleDownload(material.id, material.filename)}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// Loading UI
export default function MaterialsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="flex flex-col animate-pulse">
          <CardHeader>
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="h-4 w-1/4 bg-muted rounded" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="flex justify-between">
                <div className="h-4 w-1/4 bg-muted rounded" />
                <div className="h-4 w-1/4 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto pt-6">
            <div className="h-9 w-full bg-muted rounded" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

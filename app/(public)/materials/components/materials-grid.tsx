// components/materials/materials-grid.tsx
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
import { SupportedLanguage } from "@/store/language-context";
import { getLocalizedContent } from "@/lib/language-utils";

interface Material {
  id: string;
  title: string;
  title_sl?: string | null;
  title_hr?: string | null;
  description: string | null;
  description_sl?: string | null;
  description_hr?: string | null;
  type: string;
  size: number;
  downloads: number;
  category: string | null;
  category_sl?: string | null;
  category_hr?: string | null;
  filename: string;
}

interface MaterialsGridProps {
  materials: Material[];
  language: SupportedLanguage;
}

export function MaterialsGrid({ materials, language }: MaterialsGridProps) {
  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          {language === "sl"
            ? "Ni najdenih materialov. Poskusite prilagoditi filtre."
            : language === "hr"
              ? "Nema pronađenih materijala. Pokušajte prilagoditi filtre."
              : "No materials found. Try adjusting your filters."}
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

      toast.success(
        language === "sl"
          ? "Prenos se je začel"
          : language === "hr"
            ? "Preuzimanje započeto"
            : "Download started"
      );
    } catch (error) {
      console.error("[MATERIAL_DOWNLOAD]", error);
      toast.error(
        language === "sl"
          ? "Prenos ni uspel"
          : language === "hr"
            ? "Preuzimanje nije uspjelo"
            : "Download failed"
      );
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {materials.map((material) => {
        const title = getLocalizedContent(material, "title", language);
        const description = getLocalizedContent(
          material,
          "description",
          language
        );
        const category = getLocalizedContent(material, "category", language);

        return (
          <Card key={material.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="line-clamp-2">{title}</CardTitle>
              {category && (
                <Badge variant="secondary" className="w-fit">
                  {category}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {description && (
                <CardDescription className="line-clamp-2 mb-4">
                  {description}
                </CardDescription>
              )}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <File className="mr-2 h-4 w-4" />
                  <span>{formatBytes(material.size)}</span>
                </div>
                <div>
                  {material.downloads}{" "}
                  {language === "sl"
                    ? "prenosov"
                    : language === "hr"
                      ? "preuzimanja"
                      : "downloads"}
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-auto pt-6">
              <Button
                className="w-full"
                onClick={() => handleDownload(material.id, material.filename)}
              >
                <Download className="mr-2 h-4 w-4" />{" "}
                {language === "sl"
                  ? "Prenesi"
                  : language === "hr"
                    ? "Preuzmi"
                    : "Download"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

// Loading UI remains the same
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

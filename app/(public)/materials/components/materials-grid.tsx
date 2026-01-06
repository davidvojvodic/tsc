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
import { Download, File, Globe, Eye, ExternalLink, FileText, FileSpreadsheet, FileImage, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SupportedLanguage } from "@/store/language-context";
import { getLocalizedContent } from "@/lib/language-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import dynamic from "next/dynamic";

const PdfThumbnail = dynamic(() => import("@/components/pdf-thumbnail"), { 
    ssr: false,
    loading: () => <div className="w-full h-48 bg-muted/10 flex items-center justify-center animate-pulse"><FileText className="h-10 w-10 text-muted-foreground/20" /></div>
});

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
  language: string;
  url: string;
  previewUrl?: string | null;
}

interface MaterialsGridProps {
  materials: Material[];
  language: SupportedLanguage;
}

export function MaterialsGrid({ materials, language }: MaterialsGridProps) {
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Reset loading state when material changes
  const handlePreviewOpen = (material: Material) => {
    setPreviewMaterial(material);
    setIsPreviewLoading(true);
  };

  const getPreviewContent = (material: Material) => {
    const defaultPreview = (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <File className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
                {language === "sl" ? "Predogled ni na voljo" : language === "hr" ? "Pregled nije dostupan" : "Preview not available"}
            </p>
            <Button onClick={() => handleDownload(material.id, material.filename)}>
                <Download className="mr-2 h-4 w-4" />
                {language === "sl" ? "Prenesi datoteko" : language === "hr" ? "Preuzmi datoteku" : "Download file"}
            </Button>
        </div>
    );

    if (!material.url) return defaultPreview;

    const fileExt = material.filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-md overflow-hidden">
                <img 
                    src={material.url} 
                    alt={material.title} 
                    className="max-w-full max-h-full object-contain" 
                />
            </div>
        );
    }
    
    if (fileExt === 'pdf') {
        return (
            <div className="w-full flex-1 relative bg-muted/5 rounded-md border overflow-hidden">
                {isPreviewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                    </div>
                )}
                <iframe 
                    src={material.url} 
                    className={`w-full h-full bg-white opacity-0 transition-opacity duration-300 ${!isPreviewLoading ? 'opacity-100' : ''}`}
                    onLoad={() => setIsPreviewLoading(false)}
                />
            </div>
        );
    }
    
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt || '')) {
        return (
             <div className="w-full flex-1 relative bg-muted/5 rounded-md border overflow-hidden">
                {isPreviewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                    </div>
                )}
                <iframe 
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.url)}`}
                    className={`w-full h-full bg-white opacity-0 transition-opacity duration-300 ${!isPreviewLoading ? 'opacity-100' : ''}`}
                    onLoad={() => setIsPreviewLoading(false)}
                />
            </div>
        );
    }

    return defaultPreview;
  };
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

  // Function to get language display name
  const getLanguageName = (langCode: string, currentLang: string): string => {
    if (langCode === "en") {
      return currentLang === "sl" ? "Angleščina" : 
             currentLang === "hr" ? "Engleski" : "English";
    } else if (langCode === "sl") {
      return currentLang === "sl" ? "Slovenščina" : 
             currentLang === "hr" ? "Slovenski" : "Slovenian";
    } else if (langCode === "hr") {
      return currentLang === "sl" ? "Hrvaščina" : 
             currentLang === "hr" ? "Hrvatski" : "Croatian";
    }
    return langCode;
  };



  const getThumbnailContent = (material: Material) => {
    // Priority 1: User uploaded preview image
    if (material.previewUrl) {
         return (
            <div className="w-full h-48 bg-muted/30 flex items-center justify-center overflow-hidden">
                <img 
                    src={material.previewUrl} 
                    alt={material.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                />
            </div>
        );
    }

    if (!material.url) {
        return (
            <div className="w-full h-48 bg-muted/30 flex items-center justify-center">
                <File className="h-16 w-16 text-muted-foreground/50" />
            </div>
        );
    }

    const fileExt = material.filename.split('.').pop()?.toLowerCase();
    
    // Image thumbnail
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')) {
         return (
            <div className="w-full h-48 bg-muted/30 flex items-center justify-center overflow-hidden">
                <img 
                    src={material.url} 
                    alt={material.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                />
            </div>
        );
    }

    // PDF Thumbnail generation causing runtime errors (Object.defineProperty)
    // Disabled to prevent page crashes. Falls back to icon.
    // if (fileExt === 'pdf') {
    //     return <PdfThumbnail url={material.url} />;
    // }

    // Icon placeholders with specific colors
    let Icon = File;
    let iconClass = "text-muted-foreground/40";
    let bgClass = "bg-muted/10";

    if (fileExt === 'pdf') {
        Icon = FileText;
        iconClass = "text-red-500/60 group-hover:text-red-600";
        bgClass = "bg-red-500/5 group-hover:bg-red-500/10";
    }
    else if (['doc', 'docx'].includes(fileExt || '')) {
        Icon = FileText;
        iconClass = "text-blue-500/60 group-hover:text-blue-600";
        bgClass = "bg-blue-500/5 group-hover:bg-blue-500/10";
    }
    else if (['xls', 'xlsx', 'csv'].includes(fileExt || '')) {
        Icon = FileSpreadsheet;
        iconClass = "text-green-500/60 group-hover:text-green-600";
        bgClass = "bg-green-500/5 group-hover:bg-green-500/10";
    }
    else if (['ppt', 'pptx'].includes(fileExt || '')) {
        Icon = FileImage;
        iconClass = "text-orange-500/60 group-hover:text-orange-600";
        bgClass = "bg-orange-500/5 group-hover:bg-orange-500/10";
    }

    return (
        <div className={`w-full h-48 flex items-center justify-center transition-colors ${bgClass}`}>
            <Icon className={`h-20 w-20 transition-colors ${iconClass}`} />
        </div>
    );
  };

  return (
    <>
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
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="line-clamp-2 leading-tight">{title}</CardTitle>
              </div>
              {category && (
                <Badge variant="secondary" className="w-fit">
                  {category}
                </Badge>
              )}
            </CardHeader>
            
            <div 
                className="cursor-pointer group overflow-hidden border-y border-muted/20"
                onClick={() => handlePreviewOpen(material)}
            >
                {getThumbnailContent(material)}
            </div>

            <CardContent className="flex-1 pt-6 text-2xl">
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
              </div>
            </CardContent>
            <CardFooter className="mt-auto pt-6">
              <div className="flex gap-2 w-full">
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
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>


      <Dialog open={!!previewMaterial} onOpenChange={(open) => !open && setPreviewMaterial(null)}>
        <DialogContent className="max-w-[90vw] w-full h-[90vh] flex flex-col">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="mr-4">
                  {previewMaterial && getLocalizedContent(previewMaterial, "title", language)}
              </DialogTitle>
              <DialogDescription className="sr-only">
                  {previewMaterial ? `Preview of ${previewMaterial.filename}` : "Material preview"}
              </DialogDescription>
              {previewMaterial && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={previewMaterial.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </DialogHeader>
            {previewMaterial && getPreviewContent(previewMaterial)}
        </DialogContent>
      </Dialog>
    </>
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
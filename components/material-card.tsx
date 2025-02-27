// components/materials/material-card.tsx
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
import { useLanguage } from "@/store/language-context";
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

export function MaterialCard({ material }: { material: Material }) {
  const { language } = useLanguage();

  const title = getLocalizedContent(material, "title", language);
  const description = getLocalizedContent(material, "description", language);
  const category = getLocalizedContent(material, "category", language);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/materials/${material.id}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = material.filename;
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
    <Card className="flex flex-col">
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
          <div>{material.downloads} downloads</div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-6">
        <Button className="w-full" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </CardFooter>
    </Card>
  );
}

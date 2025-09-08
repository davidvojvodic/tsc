// app/admin/media/components/media-grid.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { formatBytes } from "@/lib/utils";
import { MediaItem } from "./client";
import { Card } from "@/components/ui/card";
import { 
  File, 
  FileText, 
  Film, 
  Image as ImageIcon, 
  Music,
  Copy, 
  Eye, 
  MoreHorizontal, 
  Trash,
  Download,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/modals/alert-modal";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface MediaGridProps {
  items: MediaItem[];
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.startsWith('application/pdf')) return BookOpen;
  if (mimeType.startsWith('application/')) return FileText;
  return File;
};

export function MediaGrid({ items }: MediaGridProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("ID copied to clipboard");
  };

  const onCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const onPreview = (url: string) => {
    window.open(url, '_blank');
  };

  const onDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const onDelete = async (item: MediaItem) => {
    try {
      setLoading(true);
      const endpoint = item.source === 'media' ? 'media' : 'materials';
      const response = await fetch(`/api/${endpoint}/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success("File deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("[DELETE_ERROR]", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 border rounded-lg">
        <p className="text-muted-foreground">No files found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden group relative">
          <AlertModal
            isOpen={deletingId === item.id}
            onClose={() => setDeletingId(null)}
            onConfirm={() => onDelete(item)}
            loading={loading}
          />
          
          {/* Source Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 z-10"
          >
            {item.source === 'media' ? 'Media' : 'Resource'}
          </Badge>

          <div className="relative aspect-square">
            {/* Preview */}
            {item.mimeType.startsWith('image/') ? (
              <Image
                src={item.url}
                alt={item.filename}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
                {(() => {
                  const IconComponent = getFileIcon(item.mimeType);
                  return <IconComponent className="h-12 w-12 text-muted-foreground" />;
                })()}
                <Badge variant="secondary">
                  {item.source === 'material' 
                    ? item.type 
                    : item.mimeType.split('/')[1].toUpperCase()}
                </Badge>
              </div>
            )}
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu 
                open={dropdownOpen === item.id} 
                onOpenChange={(open) => setDropdownOpen(open ? item.id : null)}
              >
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="absolute top-2 right-2"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onCopy(item.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy ID
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopyUrl(item.url)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPreview(item.url)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDownload(item.url, item.filename)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setDropdownOpen(null); // Close dropdown first
                      setTimeout(() => setDeletingId(item.id), 100); // Then open modal with delay
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Info */}
          <div className="p-3 space-y-1">
            <p className="text-sm font-medium truncate" title={item.filename}>
              {item.filename}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{formatBytes(item.size)}</span>
              {item.downloads !== undefined && (
                <span>· {item.downloads} downloads</span>
              )}
              <span>· {item.type}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
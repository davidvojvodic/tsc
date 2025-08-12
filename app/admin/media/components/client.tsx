// app/admin/media/components/client.tsx
"use client";

import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { MediaGrid } from "./media-grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MediaType } from "@prisma/client";

export type MediaItem = {
  id: string;
  source: 'media' | 'material';
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  alt: string | null;
  createdAt: string;
  downloads?: number;
};

interface MediaClientProps {
  data: MediaItem[];
}

export const MediaClient: React.FC<MediaClientProps> = ({ data }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  const filteredMedia = data.filter((item) => {
    const matchesSearch = item.filename.toLowerCase().includes(search.toLowerCase());
    const matchesType = filter === "ALL" || item.type === filter;
    const matchesSource = sourceFilter === "ALL" || item.source === sourceFilter;
    return matchesSearch && matchesType && matchesSource;
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Media Library (${data.length})`}
          description="View and manage all uploaded media files and resources"
        />
      </div>
      <Separator />

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="IMAGE">Images</SelectItem>
            <SelectItem value="DOCUMENT">Documents</SelectItem>
            <SelectItem value="VIDEO">Videos</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sources</SelectItem>
            <SelectItem value="media">Media Library</SelectItem>
            <SelectItem value="material">Resources</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Media Grid */}
      <MediaGrid items={filteredMedia} />
    </>
  );
};
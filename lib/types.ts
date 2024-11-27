// lib/types/index.ts

export interface Teacher {
  id: string;
  name: string;
  bio?: string | null;
  photo?: {
    url: string;
  } | null;
}

export interface ProjectPhase {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date | null;
  completed: boolean;
  order: number;
  media?: { url: string } | null;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt: string | null; // Changed to match your Prisma schema
}
export interface ProjectFormData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  published: boolean;
  featured: boolean;
  heroImage: {
    url: string;
    id: string;
  } | null;
  timeline: Array<{
    id: string;
    title: string;
    description: string;
    startDate: Date | null | undefined | string;
    endDate?: Date | null | undefined | string;
    completed: boolean;
    mediaId?: string;
  }>;
  gallery: Array<{
    id: string;
    url: string;
  }>;
  teachers: Array<Teacher>;
}

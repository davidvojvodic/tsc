// lib/types/index.ts

// lib/types.ts

export interface Teacher {
  id: string;

  name: string;

  title?: string | null;

  title_sl?: string | null;

  title_hr?: string | null;

  bio?: string | null;

  bio_sl?: string | null;

  bio_hr?: string | null;

  email?: string | null;

  displayOrder?: number;

  school?: string | null;

  photo?: {
    url: string;
  } | null;

  createdAt?: string | Date;
}

export interface ProjectPhase {
  id: string;

  title: string;

  description: string;

  startDate: Date | null;

  endDate?: Date | null;

  completed: boolean;

  order: number;
}

export interface GalleryImage {
  id: string;

  url: string;

  ufsUrl?: string;

  alt: string | null; // Changed to match your Prisma schema
}

export interface ProjectFormData {
  id: string;

  name: string;
  name_sl?: string | null;
  name_hr?: string | null;

  slug: string;

  description: string | null;
  description_sl?: string | null;
  description_hr?: string | null;

  published: boolean;

  featured: boolean;

  heroImage: {
    url: string;

    id: string;
  } | null;

  timeline: Array<{
    id: string;

    title: string;
    title_sl?: string | null;
    title_hr?: string | null;

    description: string;
    description_sl?: string | null;
    description_hr?: string | null;

    startDate: Date | null | undefined | string;

    endDate?: Date | null | undefined | string;

    completed: boolean;

    activities?: Array<{
      id: string;
      title: string;
      title_sl?: string | null;
      title_hr?: string | null;
      description: string;
      description_sl?: string | null;
      description_hr?: string | null;
      order: number;
      // Arrays for multiple teachers and images
      teacherIds?: string[];
      imageIds?: string[];
      // Keep legacy support for raw API data
      teachers?: Array<{ teacher: { id: string; name: string } }>;
      images?: Array<{ media: { id: string; url: string } }>;
      // Legacy single fields (deprecated)
      teacherId?: string | null;
      teacher?: Teacher | null;
      imageId?: string | null;
      image?: {
        id: string;
        url: string;
      } | null;
    }>;
  }>;

  gallery: Array<{
    id: string;

    url: string;
  }>;

  teachers: Array<Teacher>;
}

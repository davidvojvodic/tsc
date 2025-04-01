// store/use-project-form.ts
import { create } from "zustand";

export interface ProjectBasicInfo {
  name: string;
  name_sl: string | null;
  name_hr: string | null;
  slug: string;
  description: string | null;
  description_sl: string | null;
  description_hr: string | null;
  published: boolean;
  featured: boolean;
  heroImage: { url: string; fileKey: string } | null;
}

export interface ProjectPhase {
  id: string;
  title: string;
  title_sl: string | null;
  title_hr: string | null;
  description: string;
  description_sl: string | null;
  description_hr: string | null;
  startDate: Date | null | undefined;
  endDate: Date | null | undefined;
  completed: boolean;
  order: number;
  media: ProjectImage[] | null;
}

export interface ProjectImage {
  id: string;
  url: string;
  ufsUrl?: string;
  fileKey: string;
  alt: string | null;
}

interface ProjectFormState {
  currentStep: number;
  isLoading: boolean;
  basicInfo: ProjectBasicInfo;
  timeline: ProjectPhase[];
  gallery: ProjectImage[];
  teachers: string[];
}

interface ProjectFormStore extends ProjectFormState {
  setCurrentStep: (step: number) => void;
  setBasicInfo: (data: ProjectBasicInfo) => void;
  setTimeline: (timeline: ProjectPhase[]) => void;
  setGallery: (gallery: ProjectImage[]) => void;
  setTeachers: (teachers: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState: ProjectFormState = {
  currentStep: 0,
  isLoading: false,
  basicInfo: {
    name: "",
    name_sl: null,
    name_hr: null,
    slug: "",
    description: null,
    description_sl: null,
    description_hr: null,
    published: false,
    featured: false,
    heroImage: null,
  },
  timeline: [],
  gallery: [],
  teachers: [],
};

export const useProjectForm = create<ProjectFormStore>((set) => ({
  ...initialState,
  setCurrentStep: (step) => set({ currentStep: step }),
  setBasicInfo: (basicInfo) => set({ basicInfo }),
  setTimeline: (timeline) => set({ timeline }),
  setGallery: (gallery) => set({ gallery }),
  setTeachers: (teachers) => set({ teachers }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));

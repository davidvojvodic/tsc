// store/use-project-form.ts
import { create } from "zustand";

export interface ProjectBasicInfo {
  name: string;
  slug: string;
  description: string | null;
  published: boolean;
  featured: boolean;
  heroImage: { url: string; fileKey: string } | null;
}

export interface ProjectPhase {
  id: string;
  title: string;
  description: string;
  startDate: Date | null | undefined;
  endDate: Date | null | undefined;
  completed: boolean;
  order: number;
  media: {
    url: string;
  } | null;
}

export interface ProjectImage {
  id: string;
  url: string;
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
    slug: "",
    description: null,
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

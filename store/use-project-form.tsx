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
  heroImage: { url: string; fileKey: string; id?: string } | null;
}

export interface ProjectActivity {
  id: string;
  title: string;
  title_sl: string | null;
  title_hr: string | null;
  description: string;
  description_sl: string | null;
  description_hr: string | null;
  order: number;
  teacherIds: string[];
  imageIds: string[];
  materialIds: string[];
  images?: ProjectImage[];
  // Support for raw API data structure when loading from server
  teachers?: Array<{ teacher: { id: string; name: string } }>;
  // Support for raw images data from API
  rawImages?: Array<{ media: { id: string; url: string } }>;
  // Support for raw materials data from API
  materials?: Array<{ material: { id: string; title: string; type: string } }>;
}

export interface ProjectPhase {
  id: string;
  title: string;
  title_sl: string | null;
  title_hr: string | null;
  startDate: Date | null | undefined;
  endDate: Date | null | undefined;
  completed: boolean;
  order: number;
  activities?: ProjectActivity[];
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
  // Original data for change detection
  originalData: {
    basicInfo: ProjectBasicInfo | null;
    gallery: ProjectImage[];
    teachers: string[];
    timeline: ProjectPhase[];
  };
}

interface ProjectFormStore extends ProjectFormState {
  setCurrentStep: (step: number) => void;
  setBasicInfo: (data: ProjectBasicInfo) => void;
  setTimeline: (timeline: ProjectPhase[]) => void;
  setGallery: (gallery: ProjectImage[]) => void;
  setTeachers: (teachers: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  setOriginalData: (data: Partial<ProjectFormState['originalData']>) => void;
  hasBasicInfoChanged: () => boolean;
  hasGalleryChanged: () => boolean;
  hasHeroImageChanged: () => boolean;
  hasTeachersChanged: () => boolean;
  hasTimelineChanged: () => boolean;
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
  originalData: {
    basicInfo: null,
    gallery: [],
    teachers: [],
    timeline: [],
  },
};

export const useProjectForm = create<ProjectFormStore>((set, get) => ({
  ...initialState,
  setCurrentStep: (step) => set({ currentStep: step }),
  setBasicInfo: (basicInfo) => set({ basicInfo }),
  setTimeline: (timeline) => set({ timeline }),
  setGallery: (gallery) => set({ gallery }),
  setTeachers: (teachers) => set({ teachers }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setOriginalData: (data) => set((state) => ({
    originalData: { ...state.originalData, ...data }
  })),
  
  hasBasicInfoChanged: () => {
    const { basicInfo, originalData } = get();
    if (!originalData.basicInfo) return true; // First save
    
    return basicInfo.name !== originalData.basicInfo.name ||
           basicInfo.name_sl !== originalData.basicInfo.name_sl ||
           basicInfo.name_hr !== originalData.basicInfo.name_hr ||
           basicInfo.description !== originalData.basicInfo.description ||
           basicInfo.description_sl !== originalData.basicInfo.description_sl ||
           basicInfo.description_hr !== originalData.basicInfo.description_hr ||
           basicInfo.published !== originalData.basicInfo.published ||
           basicInfo.featured !== originalData.basicInfo.featured ||
           basicInfo.slug !== originalData.basicInfo.slug;
  },
  
  hasGalleryChanged: () => {
    const { gallery, originalData } = get();
    if (originalData.gallery.length !== gallery.length) return true;
    
    return gallery.some((img, index) => {
      const originalImg = originalData.gallery[index];
      return !originalImg || 
             originalImg.id !== img.id || 
             originalImg.url !== img.url ||
             originalImg.fileKey !== img.fileKey;
    });
  },
  
  hasHeroImageChanged: () => {
    const { basicInfo, originalData } = get();
    const original = originalData.basicInfo?.heroImage;
    const current = basicInfo.heroImage;
    
    if (!original && !current) return false;
    if (!original || !current) return true;
    
    return original.id !== current.id || 
           original.url !== current.url ||
           original.fileKey !== current.fileKey;
  },
  
  hasTeachersChanged: () => {
    const { teachers, originalData } = get();
    if (teachers.length !== originalData.teachers.length) return true;
    
    return teachers.some((teacherId, index) => 
      originalData.teachers[index] !== teacherId
    );
  },
  
  hasTimelineChanged: () => {
    const { timeline, originalData } = get();
    if (timeline.length !== originalData.timeline.length) return true;
    
    return timeline.some((phase, index) => {
      const originalPhase = originalData.timeline[index];
      if (!originalPhase) return true;
      
      // Check basic phase properties
      if (phase.title !== originalPhase.title ||
          phase.title_sl !== originalPhase.title_sl ||
          phase.title_hr !== originalPhase.title_hr ||
          phase.completed !== originalPhase.completed ||
          phase.startDate !== originalPhase.startDate ||
          phase.endDate !== originalPhase.endDate) {
        return true;
      }
      
      // Check activities
      const phaseActivities = phase.activities || [];
      const originalActivities = originalPhase.activities || [];
      
      if (phaseActivities.length !== originalActivities.length) return true;
      
      return phaseActivities.some((activity, actIndex) => {
        const originalActivity = originalActivities[actIndex];
        if (!originalActivity) return true;
        
        return activity.title !== originalActivity.title ||
               activity.title_sl !== originalActivity.title_sl ||
               activity.title_hr !== originalActivity.title_hr ||
               activity.description !== originalActivity.description ||
               activity.description_sl !== originalActivity.description_sl ||
               activity.description_hr !== originalActivity.description_hr ||
               JSON.stringify(activity.teacherIds?.sort()) !== JSON.stringify(originalActivity.teacherIds?.sort()) ||
               JSON.stringify(activity.imageIds?.sort()) !== JSON.stringify(originalActivity.imageIds?.sort()) ||
               JSON.stringify(activity.materialIds?.sort()) !== JSON.stringify(originalActivity.materialIds?.sort());
      });
    });
  },
  
  reset: () => set(initialState),
}));

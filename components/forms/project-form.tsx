"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProjectFormData, Teacher } from "@/lib/types";
import { Check, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useProjectForm } from "@/store/use-project-form";
import { BasicForm } from "../project/basic-form";
import { TimelineEditor } from "../project/timeline-editor";
import { GalleryEditor } from "../project/gallery-editor";
import { TeacherSelector } from "../project/teacher-selector";

const steps = [
  {
    id: "basic",
    title: "Basic Info",
    description: "Project name, description, and settings",
  },
  {
    id: "timeline",
    title: "Timeline",
    description: "Add project phases and milestones",
  },
  {
    id: "gallery",
    title: "Gallery",
    description: "Upload and manage project images",
  },
  {
    id: "teachers",
    title: "Teachers",
    description: "Assign teachers to the project",
  },
];

interface ProjectFormProps {
  initialData?: ProjectFormData;
  availableTeachers: Teacher[];
}

export function ProjectForm({
  initialData,
  availableTeachers,
}: ProjectFormProps) {
  const router = useRouter();
  const {
    currentStep,
    basicInfo,
    timeline,
    gallery,
    teachers,
    isLoading,
    setCurrentStep,
    setBasicInfo,
    setTimeline,
    setGallery,
    setTeachers,
    setIsLoading,
    reset,
  } = useProjectForm();

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setBasicInfo({
        name: initialData.name,
        slug: initialData.slug,
        description: initialData.description || "",
        published: initialData.published,
        featured: initialData.featured,
        heroImage: initialData.heroImage
          ? {
              url: initialData.heroImage.url,
              fileKey: initialData.heroImage.id,
            }
          : null,
      });

      // Transform timeline data
      const transformedTimeline = initialData.timeline.map((phase, index) => ({
        ...phase,
        startDate: phase.startDate ? new Date(phase.startDate) : null,
        endDate: phase.endDate ? new Date(phase.endDate) : null,
        order: index,
        media: phase.mediaId ? { url: phase.mediaId } : null,
      }));
      setTimeline(transformedTimeline);

      // Transform gallery data
      const transformedGallery = initialData.gallery.map((img) => ({
        id: img.id,
        url: img.url,
        fileKey: img.id,
        alt: null,
      }));
      setGallery(transformedGallery);

      setTeachers(initialData.teachers.map((t) => t.id));
    }

    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset, setBasicInfo]);

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return basicInfo.name.length >= 2 && basicInfo.slug.length >= 2;
      case 1:
        return timeline.length > 0;
      case 2:
        return gallery.length > 0;
      case 3:
        return teachers.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!isStepValid(3)) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setIsLoading(true);

      const formData = {
        basicInfo,
        timeline,
        gallery: gallery.map(({ ...rest }) => rest),
        teacherIds: teachers,
      };

      const response = await fetch(
        initialData ? `/api/projects/${initialData.id}` : "/api/projects",
        {
          method: initialData ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(
        initialData
          ? "Project updated successfully"
          : "Project created successfully"
      );
      router.push("/admin/projects");
      router.refresh();
    } catch (error) {
      console.error("[PROJECT_SUBMIT_ERROR]", error);
      toast.error("Failed to save project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="w-full">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="relative flex items-center justify-center flex-col">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2 
                  ${
                    index === currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : index < currentStep
                        ? "border-green-500 bg-green-500 text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-center">
                  <div className="font-medium">{step.title}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-full transition-all duration-500 ${
                    index < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {initialData ? "Edit Project" : "Create New Project"}
          </CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {currentStep === 0 && (
              <BasicForm
                value={basicInfo}
                onChange={setBasicInfo}
                isLoading={isLoading}
              />
            )}

            {currentStep === 1 && (
              <TimelineEditor
                value={timeline}
                onChange={setTimeline}
                isLoading={isLoading}
              />
            )}

            {currentStep === 2 && (
              <GalleryEditor
                value={gallery}
                onChange={setGallery}
                isLoading={isLoading}
              />
            )}

            {currentStep === 3 && (
              <TeacherSelector
                value={teachers} // Array of teacher IDs
                onChange={setTeachers}
                availableTeachers={availableTeachers}
                isLoading={isLoading}
              />
            )}

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep) || isLoading}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isStepValid(currentStep) || isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {initialData ? "Save Changes" : "Create Project"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

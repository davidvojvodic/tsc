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
import {
  ProjectPhase as StoreProjectPhase,
  ProjectImage,
} from "@/store/use-project-form";
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
    id: "gallery",
    title: "Gallery",
    description: "Upload and manage project images",
  },
  {
    id: "timeline",
    title: "Timeline",
    description: "Add project phases and milestones",
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
        name_sl: initialData.name_sl || null,
        name_hr: initialData.name_hr || null,
        slug: initialData.slug,
        description: initialData.description || "",
        description_sl: initialData.description_sl || null,
        description_hr: initialData.description_hr || null,
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
      const transformedTimeline = initialData.timeline.map((phase, index) => {
        // Create a properly typed ProjectPhase object
        const typedPhase: StoreProjectPhase = {
          id: phase.id,
          title: phase.title,
          title_sl: phase.title_sl || null,
          title_hr: phase.title_hr || null,
          startDate: phase.startDate ? new Date(phase.startDate) : null,
          endDate: phase.endDate ? new Date(phase.endDate) : null,
          completed: phase.completed,
          order: index,
          // Transform activities to match ProjectActivity interface
          activities:
            phase.activities?.map((activity) => {
              return {
                id: activity.id,
                title: activity.title,
                title_sl: activity.title_sl || null,
                title_hr: activity.title_hr || null,
                description: activity.description,
                description_sl: activity.description_sl || null,
                description_hr: activity.description_hr || null,
                order: activity.order,
                // Use the correctly populated arrays from the server
                teacherIds: activity.teacherIds || [],
                imageIds: activity.imageIds || [],
                // Keep the raw data for reference
                teachers: activity.teachers,
                rawImages: activity.images,
              };
            }) || [],
        };
        return typedPhase;
      });
      setTimeline(transformedTimeline);

      // Transform gallery data
      const transformedGallery: ProjectImage[] = initialData.gallery.map(
        (img) => ({
          id: img.id,
          url: img.url,
          fileKey: img.id,
          alt: null,
        })
      );
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
        // Allow proceeding even without images
        return true;
      case 2:
        return timeline.length > 0;
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

      if (initialData) {
        // For editing, use chunked updates
        await handleChunkedUpdate();
      } else {
        // For new projects, use the original single endpoint
        await handleSingleCreate();
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

      // Display detailed error message in toast
      if (error instanceof Error) {
        // Split multiline errors for better display
        const errorLines = error.message.split("\n");
        if (errorLines.length > 1) {
          // Show first line as main error
          toast.error(errorLines[0], {
            description: errorLines.slice(1).join("\n"),
            duration: 10000, // Show for longer when there are details
          });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("An unexpected error occurred while saving the project");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChunkedUpdate = async () => {
    const projectId = initialData!.id;

    // Step 1: Update basic info and hero image
    const basicInfoResponse = await fetch(
      `/api/projects/${projectId}/basic-info`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(basicInfo),
      }
    );

    if (!basicInfoResponse.ok) {
      const error = await parseError(basicInfoResponse);
      throw new Error(error);
    }

    // Step 2: Update gallery
    const galleryResponse = await fetch(`/api/projects/${projectId}/gallery`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gallery: gallery.map(({ ...rest }) => rest) }),
    });

    if (!galleryResponse.ok) {
      const error = await parseError(galleryResponse);
      throw new Error(error);
    }

    // Step 3: Update teachers
    const teachersResponse = await fetch(
      `/api/projects/${projectId}/teachers`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherIds: teachers }),
      }
    );

    if (!teachersResponse.ok) {
      const error = await parseError(teachersResponse);
      throw new Error(error);
    }

    // Step 4: Update timeline (this is the most complex part)
    if (timeline.length > 0) {
      const timelineResponse = await fetch(
        `/api/projects/${projectId}/timeline`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ timeline }),
        }
      );

      if (!timelineResponse.ok) {
        const error = await parseError(timelineResponse);
        throw new Error(error);
      }
    }
  };

  const handleSingleCreate = async () => {
    const formData = {
      basicInfo,
      timeline,
      gallery: gallery.map(({ ...rest }) => rest),
      teacherIds: teachers,
    };

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }
  };

  const parseError = async (response: Response): Promise<string> => {
    const contentType = response.headers.get("content-type");
    let errorMessage = "Failed to save project";

    try {
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();

        // Handle Zod validation errors
        if (Array.isArray(errorData)) {
          const errors = errorData
            .map((err) => {
              const path = err.path.join(" > ");
              return `${path}: ${err.message}`;
            })
            .join("\n");
          errorMessage = `Validation errors:\n${errors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === "object") {
          errorMessage = JSON.stringify(errorData);
        }
      } else {
        // Handle text responses
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }

      // Add status code information
      if (response.status === 400) {
        errorMessage = `Bad Request: ${errorMessage}`;
      } else if (response.status === 401) {
        errorMessage = "Unauthorized: Please log in again";
      } else if (response.status === 403) {
        errorMessage =
          "Forbidden: You don't have permission to perform this action";
      } else if (response.status === 422) {
        errorMessage = `Invalid data: ${errorMessage}`;
      } else if (response.status === 500) {
        errorMessage = `Server error: ${errorMessage}`;
      } else if (response.status === 504) {
        errorMessage =
          "Request timeout: The operation took too long to complete";
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
    }

    return errorMessage;
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
              <GalleryEditor
                value={gallery}
                onChange={setGallery}
                isLoading={isLoading}
              />
            )}

            {currentStep === 2 && (
              <TimelineEditor
                value={timeline}
                onChange={setTimeline}
                isLoading={isLoading}
                galleryImages={gallery}
                availableTeachers={availableTeachers}
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

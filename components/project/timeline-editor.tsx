/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import {
  Loader2,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  GripVertical,
  X,
  Pencil,
  Check,
} from "lucide-react";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { RichTextEditor } from "@/components/rich-text-editor";
import { RichTextDisplay } from "@/components/rich-text-content";
import {
  ProjectPhase,
  ProjectImage,
  ProjectActivity,
} from "@/store/use-project-form";
import { Teacher } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  completed: z.boolean().default(false),
});

interface TimelineEditorProps {
  value: ProjectPhase[];
  onChange: (phases: ProjectPhase[]) => void;
  isLoading?: boolean;
  galleryImages?: ProjectImage[];
  availableTeachers?: Teacher[];
}

export function TimelineEditor({
  value: phases,
  onChange,
  isLoading = false,
  galleryImages = [],
  availableTeachers = [],
}: TimelineEditorProps) {
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);

  // Use refs to prevent re-renders of drag and drop while editing
  const phaseListRef = useRef(phases);
  phaseListRef.current = phases;

  // Debug current phases
  useEffect(() => {
    if (phases.length > 0) {
      console.log("Timeline loaded:", phases.length, "phases");
    }
  }, [phases]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      title_sl: null,
      title_hr: null,
      startDate: null,
      endDate: null,
      completed: false,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(phaseListRef.current);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedPhases = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    onChange(updatedPhases);
  };

  const startEditing = (phase: ProjectPhase) => {
    setEditingPhaseId(phase.id);
    setIsAddingPhase(false);
    console.log("Editing phase:", phase.title);
    form.reset({
      title: phase.title,
      title_sl: phase.title_sl || null,
      title_hr: phase.title_hr || null,
      startDate: phase.startDate ? new Date(phase.startDate) : null,
      endDate: phase.endDate ? new Date(phase.endDate) : null,
      completed: phase.completed,
    });
  };

  const handleAddPhase = (values: z.infer<typeof formSchema>) => {
    const newPhase: ProjectPhase = {
      id: crypto.randomUUID(),
      ...values,
      order: phases.length,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    };

    onChange([...phases, newPhase]);
    setIsAddingPhase(false);
    form.reset();
    toast.success("Activity added successfully");
  };

  const handleUpdatePhase = (values: z.infer<typeof formSchema>) => {
    if (!editingPhaseId) return;

    const updatedPhases = phases.map((phase) => {
      if (phase.id === editingPhaseId) {
        return {
          ...phase,
          ...values,
          startDate: values.startDate || undefined,
          endDate: values.endDate || undefined,
        };
      }
      return phase;
    });

    onChange(updatedPhases);
    setEditingPhaseId(null);
    form.reset();
    toast.success("Activity updated successfully");
  };

  const handleDeletePhase = (phaseId: string) => {
    const updatedPhases = phases
      .filter((phase) => phase.id !== phaseId)
      .map((phase, index) => ({
        ...phase,
        order: index,
      }));

    onChange(updatedPhases);
    toast.success("Activity deleted successfully");
  };

  const clearDate = (field: "startDate" | "endDate") => {
    form.setValue(field, null);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    try {
      const parsedDate = typeof date === "string" ? parseISO(date) : date;
      return format(parsedDate, "MMM d, yyyy");
    } catch (error) {
      console.error("Date parsing error:", error);
      return null;
    }
  };

  // Separate upload dialog component

  // Separate edit form from the timeline view
  if (isAddingPhase || editingPhaseId) {
    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {isAddingPhase ? "Add New Activity Phase" : "Edit Activity Phase"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  isAddingPhase ? handleAddPhase : handleUpdatePhase
                )}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Activity Phase Title</h3>
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="sl">Slovenian</TabsTrigger>
                      <TabsTrigger value="hr">Croatian</TabsTrigger>
                    </TabsList>

                    <TabsContent value="en" className="mt-0">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                disabled={isLoading}
                                placeholder="Enter activity phase title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="sl" className="mt-0">
                      <FormField
                        control={form.control}
                        name="title_sl"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                disabled={isLoading}
                                placeholder="Enter Slovenian activity phase title"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value || null)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="hr" className="mt-0">
                      <FormField
                        control={form.control}
                        name="title_hr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                disabled={isLoading}
                                placeholder="Enter Croatian activity phase title"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value || null)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  <span className="flex items-center">
                                    {format(field.value, "PPP")}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      type="button"
                                      className="ml-auto h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearDate("startDate");
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </span>
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={isLoading}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  <span className="flex items-center">
                                    {format(field.value, "PPP")}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      type="button"
                                      className="ml-auto h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearDate("endDate");
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </span>
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={isLoading}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="completed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark as completed</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingPhaseId(null);
                      setIsAddingPhase(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isAddingPhase ? "Add Phase" : "Update Phase"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>
          Manage the activities and milestones of your project
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {phases.length > 0 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="timeline">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {phases.map((phase, index) => (
                    <Draggable
                      key={phase.id}
                      draggableId={phase.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="relative rounded-lg border bg-card p-4"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div
                                {...provided.dragHandleProps}
                                className="flex items-center justify-center"
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold">
                                    {phase.title}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => startEditing(phase)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleDeletePhase(phase.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-start gap-4 mt-2">
                                  <div className="text-sm">
                                    {(phase.startDate || phase.endDate) && (
                                      <div className="text-sm">
                                        {phase.startDate &&
                                          formatDate(phase.startDate)}
                                        {phase.startDate &&
                                          phase.endDate &&
                                          " - "}
                                        {phase.endDate &&
                                          formatDate(phase.endDate)}
                                      </div>
                                    )}
                                  </div>
                                  {phase.completed && (
                                    <Badge variant="secondary">Completed</Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Activities Section */}
                            <div className="ml-9">
                              <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                              >
                                <AccordionItem
                                  value="activities"
                                  className="border-none"
                                >
                                  <AccordionTrigger className="hover:no-underline py-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span>Activities</span>
                                      <Badge
                                        variant="outline"
                                        className="h-5 px-2"
                                      >
                                        {phase.activities?.length || 0}
                                      </Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ActivityManager
                                      phaseId={phase.id}
                                      activities={phase.activities || []}
                                      onActivitiesChange={(activities) => {
                                        const updatedPhases = phases.map((p) =>
                                          p.id === phase.id
                                            ? { ...p, activities }
                                            : p
                                        );
                                        onChange(updatedPhases);
                                      }}
                                      galleryImages={galleryImages}
                                      availableTeachers={availableTeachers}
                                      isLoading={isLoading}
                                    />
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <Button onClick={() => setIsAddingPhase(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Activity Phase
        </Button>
      </CardContent>
    </Card>
  );
}

// Activity Manager Component
interface ActivityManagerProps {
  phaseId: string;
  activities: ProjectActivity[];
  onActivitiesChange: (activities: ProjectActivity[]) => void;
  galleryImages: ProjectImage[];
  availableTeachers: Teacher[];
  isLoading?: boolean;
}

function ActivityManager({
  activities,
  onActivitiesChange,
  galleryImages,
  availableTeachers,
  isLoading = false,
}: ActivityManagerProps) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null
  );

  const activityFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    title_sl: z.string().nullable(),
    title_hr: z.string().nullable(),
    description: z.string().min(1, "Description is required"),
    description_sl: z.string().nullable(),
    description_hr: z.string().nullable(),
    teacherIds: z.array(z.string()),
    imageIds: z.array(z.string()),
  });

  const activityForm = useForm<z.infer<typeof activityFormSchema>>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: "",
      title_sl: null,
      title_hr: null,
      description: "",
      description_sl: null,
      description_hr: null,
      teacherIds: [],
      imageIds: [],
    },
  });

  const handleAddActivity = (values: z.infer<typeof activityFormSchema>) => {
    const selectedImages = galleryImages.filter((img) =>
      values.imageIds.includes(img.id)
    );
    const newActivity: ProjectActivity = {
      id: crypto.randomUUID(),
      ...values,
      order: activities.length,
      images: selectedImages,
    };
    onActivitiesChange([...activities, newActivity]);
    setIsAddingActivity(false);
    activityForm.reset();
    toast.success("Activity added successfully");
  };

  const handleUpdateActivity = (values: z.infer<typeof activityFormSchema>) => {
    if (!editingActivityId) return;
    const selectedImages = galleryImages.filter((img) =>
      values.imageIds.includes(img.id)
    );
    const updatedActivities = activities.map((activity) =>
      activity.id === editingActivityId
        ? { ...activity, ...values, images: selectedImages }
        : activity
    );
    onActivitiesChange(updatedActivities);
    setEditingActivityId(null);
    activityForm.reset();
    toast.success("Activity updated successfully");
  };

  const handleDeleteActivity = (activityId: string) => {
    const updatedActivities = activities
      .filter((activity) => activity.id !== activityId)
      .map((activity, index) => ({ ...activity, order: index }));
    onActivitiesChange(updatedActivities);
    toast.success("Activity deleted successfully");
  };

  const startEditingActivity = (activity: ProjectActivity) => {
    setEditingActivityId(activity.id);
    setIsAddingActivity(false);

    // Handle both transformed data (teacherIds/imageIds arrays) and raw API data (teachers/images objects)
    const teacherIds =
      activity.teacherIds ||
      (activity.teachers
        ? activity.teachers
            .map((t: any) => t.teacher?.id || t.id)
            .filter(Boolean)
        : []);

    const imageIds =
      activity.imageIds ||
      (activity.rawImages
        ? activity.rawImages
            .map((i: any) => i.media?.id || i.id)
            .filter(Boolean)
        : activity.images
          ? activity.images.map((i: any) => i.media?.id || i.id).filter(Boolean)
          : []);

    activityForm.reset({
      title: activity.title,
      title_sl: activity.title_sl,
      title_hr: activity.title_hr,
      description: activity.description,
      description_sl: activity.description_sl,
      description_hr: activity.description_hr,
      teacherIds: teacherIds,
      imageIds: imageIds,
    });
  };

  if (isAddingActivity || editingActivityId) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {isAddingActivity ? "Add New Activity" : "Edit Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...activityForm}>
            <form
              onSubmit={activityForm.handleSubmit(
                isAddingActivity ? handleAddActivity : handleUpdateActivity
              )}
              className="space-y-4"
            >
              {/* Title Fields */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Activity Title</h4>
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="sl">Slovenian</TabsTrigger>
                    <TabsTrigger value="hr">Croatian</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en">
                    <FormField
                      control={activityForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              disabled={isLoading}
                              placeholder="Enter activity title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="sl">
                    <FormField
                      control={activityForm.control}
                      name="title_sl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              disabled={isLoading}
                              placeholder="Enter Slovenian activity title"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="hr">
                    <FormField
                      control={activityForm.control}
                      name="title_hr"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              disabled={isLoading}
                              placeholder="Enter Croatian activity title"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Description Fields */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Activity Description</h4>
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="sl">Slovenian</TabsTrigger>
                    <TabsTrigger value="hr">Croatian</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en">
                    <FormField
                      control={activityForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              disabled={isLoading}
                              placeholder="Describe this activity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="sl">
                    <FormField
                      control={activityForm.control}
                      name="description_sl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              disabled={isLoading}
                              placeholder="Describe this activity in Slovenian"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="hr">
                    <FormField
                      control={activityForm.control}
                      name="description_hr"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              disabled={isLoading}
                              placeholder="Describe this activity in Croatian"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Teacher Selection */}
              <FormField
                control={activityForm.control}
                name="teacherIds"
                render={({ field }) => {
                  const selectedTeachers = availableTeachers.filter((teacher) =>
                    (field.value || []).includes(teacher.id)
                  );

                  const handleTeacherToggle = (teacherId: string) => {
                    const currentValue = field.value || [];
                    const isSelected = currentValue.includes(teacherId);
                    if (isSelected) {
                      field.onChange(
                        currentValue.filter((id) => id !== teacherId)
                      );
                    } else {
                      field.onChange([...currentValue, teacherId]);
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel>Assign Teachers (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {selectedTeachers.length === 0
                                ? "Select teachers"
                                : `${selectedTeachers.length} teacher${selectedTeachers.length !== 1 ? "s" : ""} selected`}
                              <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <div className="max-h-60 overflow-y-auto p-2">
                            {availableTeachers.length === 0 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                No teachers available
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {availableTeachers.map((teacher) => (
                                  <div
                                    key={teacher.id}
                                    onClick={() =>
                                      handleTeacherToggle(teacher.id)
                                    }
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                  >
                                    <Checkbox
                                      checked={(field.value || []).includes(
                                        teacher.id
                                      )}
                                      className="mr-2"
                                    />
                                    <span>{teacher.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {selectedTeachers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTeachers.map((teacher) => (
                            <Badge
                              key={teacher.id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {teacher.name}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                onClick={() => handleTeacherToggle(teacher.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Image Selection */}
              <FormField
                control={activityForm.control}
                name="imageIds"
                render={({ field }) => {
                  const selectedImages = galleryImages.filter((image) =>
                    (field.value || []).includes(image.id)
                  );

                  const handleImageToggle = (imageId: string) => {
                    const currentValue = field.value || [];
                    const isSelected = currentValue.includes(imageId);
                    if (isSelected) {
                      field.onChange(
                        currentValue.filter((id) => id !== imageId)
                      );
                    } else {
                      field.onChange([...currentValue, imageId]);
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel>Select Images (Optional)</FormLabel>
                      {galleryImages.length > 0 ? (
                        <div className="space-y-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {selectedImages.length === 0
                                    ? "Select images from gallery"
                                    : `${selectedImages.length} image${selectedImages.length !== 1 ? "s" : ""} selected`}
                                  <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <div className="max-h-60 overflow-y-auto p-2">
                                <div className="grid grid-cols-2 gap-2">
                                  {galleryImages.map((image, index) => {
                                    const isSelected = (
                                      field.value || []
                                    ).includes(image.id);
                                    return (
                                      <div
                                        key={image.id}
                                        onClick={() =>
                                          handleImageToggle(image.id)
                                        }
                                        className={cn(
                                          "relative cursor-pointer select-none items-center rounded-sm p-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                          isSelected &&
                                            "bg-primary/10 border border-primary"
                                        )}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            checked={isSelected}
                                            className="mr-2"
                                          />
                                          <div className="relative h-16 w-16 rounded overflow-hidden">
                                            <Image
                                              src={image.url}
                                              alt={
                                                image.alt ||
                                                `Gallery Image ${index + 1}`
                                              }
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                          <span className="text-xs">
                                            Image {index + 1}
                                          </span>
                                        </div>
                                        {isSelected && (
                                          <div className="absolute top-1 right-1">
                                            <Check className="h-4 w-4 text-primary" />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Image Previews */}
                          {selectedImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                              {selectedImages.map((image, index) => (
                                <div
                                  key={image.id}
                                  className="relative h-24 w-24 rounded-lg overflow-hidden border group"
                                >
                                  <Image
                                    src={image.url}
                                    alt={image.alt || "Selected image"}
                                    fill
                                    className="object-cover"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleImageToggle(image.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No images available. Upload images in the Gallery step
                          first.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingActivityId(null);
                    setIsAddingActivity(false);
                    activityForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isAddingActivity ? "Add Activity" : "Update Activity"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.length > 0 ? (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <Card key={activity.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEditingActivity(activity)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteActivity(activity.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    <RichTextDisplay
                      content={activity.description}
                      className="prose-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {activity.teacherIds && activity.teacherIds.length > 0 && (
                      <>
                        {activity.teacherIds.map((teacherId) => {
                          const teacher = availableTeachers.find(
                            (t) => t.id === teacherId
                          );
                          return teacher ? (
                            <Badge
                              key={teacherId}
                              variant="secondary"
                              className="text-xs"
                            >
                              {teacher.name}
                            </Badge>
                          ) : null;
                        })}
                      </>
                    )}
                    {activity.images && activity.images.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {activity.images.length} image
                        {activity.images.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No activities yet. Add one to get started.
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setIsAddingActivity(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Activity
      </Button>
    </div>
  );
}

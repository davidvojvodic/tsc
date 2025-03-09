import { useState, useCallback, useRef } from "react";
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
  Upload,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { ProjectPhase } from "@/store/use-project-form";
import { UploadDropzone } from "@/lib/uploadthing";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  completed: z.boolean().default(false),
});

interface TimelineEditorProps {
  value: ProjectPhase[];
  onChange: (phases: ProjectPhase[]) => void;
  isLoading?: boolean;
}

export function TimelineEditor({
  value: phases,
  onChange,
  isLoading = false,
}: TimelineEditorProps) {
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [phaseImage, setPhaseImage] = useState<{
    url: string;
    fileKey: string;
  } | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Use refs to prevent re-renders of drag and drop while editing
  const phaseListRef = useRef(phases);
  phaseListRef.current = phases;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
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
    setPhaseImage(phase.media ? { url: phase.media.url, fileKey: "" } : null);
    form.reset({
      title: phase.title,
      description: phase.description,
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
      media: phaseImage ? { url: phaseImage.url } : null,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    };

    onChange([...phases, newPhase]);
    setIsAddingPhase(false);
    setPhaseImage(null);
    form.reset();
    toast.success("Phase added successfully");
  };

  const handleUpdatePhase = (values: z.infer<typeof formSchema>) => {
    if (!editingPhaseId) return;

    const updatedPhases = phases.map((phase) => {
      if (phase.id === editingPhaseId) {
        return {
          ...phase,
          ...values,
          media: phaseImage ? { url: phaseImage.url } : null,
          startDate: values.startDate || undefined,
          endDate: values.endDate || undefined,
        };
      }
      return phase;
    });

    onChange(updatedPhases);
    setEditingPhaseId(null);
    setPhaseImage(null);
    form.reset();
    toast.success("Phase updated successfully");
  };

  const handleDeletePhase = (phaseId: string) => {
    const updatedPhases = phases
      .filter((phase) => phase.id !== phaseId)
      .map((phase, index) => ({
        ...phase,
        order: index,
      }));

    onChange(updatedPhases);
    toast.success("Phase deleted successfully");
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onUploadComplete = useCallback((result: any) => {
    if (result?.[0]) {
      setPhaseImage({
        url: result[0].url,
        fileKey: result[0].key,
      });
      setShowUploadDialog(false);
      toast.success("Image uploaded successfully");
    }
  }, []);

  // Separate upload dialog component
  const ImageUploadDialog = useCallback(() => {
    return (
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload image</DialogTitle>
            <DialogDescription>
              Upload an image for this phase
            </DialogDescription>
          </DialogHeader>
          <div className="grid w-full gap-4 py-4">
            <UploadDropzone
              endpoint="imageUploader"
              onClientUploadComplete={onUploadComplete}
              onUploadError={(error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowUploadDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }, [showUploadDialog, onUploadComplete]);

  // Separate edit form from the timeline view
  if (isAddingPhase || editingPhaseId) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {isAddingPhase ? "Add New Phase" : "Edit Phase"}
          </CardTitle>
          <CardDescription>
            {isAddingPhase
              ? "Add a new phase to your project timeline"
              : "Edit this phase in your project timeline"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                isAddingPhase ? handleAddPhase : handleUpdatePhase
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phase Title</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Enter phase title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={isLoading}
                        placeholder="Describe this phase"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormItem>
                <FormLabel>Phase Image</FormLabel>
                <div className="flex items-center gap-x-4">
                  <div className="relative h-24 w-24">
                    {phaseImage ? (
                      <>
                        <Image
                          src={phaseImage.url}
                          alt="Phase image"
                          fill
                          className="object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
                          onClick={() => {
                            setPhaseImage(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="h-full w-full bg-secondary rounded-md flex items-center justify-center">
                        <Upload className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUploadDialog(true)}
                    >
                      Upload Image
                    </Button>
                  </div>
                </div>
              </FormItem>

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
                    setPhaseImage(null);
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
          <ImageUploadDialog />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>
          Manage the phases and milestones of your project
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
                          <div className="flex items-center gap-4">
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{phase.title}</h3>
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
                                    onClick={() => handleDeletePhase(phase.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {phase.description}
                              </p>
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
                            {phase.media && (
                              <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                <Image
                                  src={phase.media.url}
                                  alt={phase.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
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
          Add Phase
        </Button>
      </CardContent>
    </Card>
  );
}

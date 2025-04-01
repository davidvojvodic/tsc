/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef, useEffect } from "react";
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { ProjectPhase, ProjectImage } from "@/store/use-project-form";
import { uploadFiles } from "@/lib/uploadthing";
import { useDropzone } from "react-dropzone";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_sl: z.string().nullable(),
  title_hr: z.string().nullable(),
  description: z.string().min(1, "Description is required"),
  description_sl: z.string().nullable(),
  description_hr: z.string().nullable(),
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
  const [phaseImages, setPhaseImages] = useState<ProjectImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Use refs to prevent re-renders of drag and drop while editing
  const phaseListRef = useRef(phases);
  phaseListRef.current = phases;
  
  // Debug current phases
  useEffect(() => {
    console.log("Current phases:", phases);
  }, [phases]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      title_sl: null,
      title_hr: null,
      description: "",
      description_sl: null,
      description_hr: null,
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
    setPhaseImages(phase.media || []);
    form.reset({
      title: phase.title,
      title_sl: phase.title_sl || null,
      title_hr: phase.title_hr || null,
      description: phase.description,
      description_sl: phase.description_sl || null,
      description_hr: phase.description_hr || null,
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
      media: phaseImages.length > 0 ? phaseImages : null,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    };

    onChange([...phases, newPhase]);
    setIsAddingPhase(false);
    setPhaseImages([]);
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
          media: phaseImages.length > 0 ? phaseImages : null,
          startDate: values.startDate || undefined,
          endDate: values.endDate || undefined,
        };
      }
      return phase;
    });

    onChange(updatedPhases);
    setEditingPhaseId(null);
    setPhaseImages([]);
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

  // Function to handle file selection via react-dropzone
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Optional: Limit the total number of images
      if (phaseImages.length + acceptedFiles.length > 10) {
        toast.error("You can upload a maximum of 10 images per phase");
        return;
      }
      setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [phaseImages.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected for upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setTotalFiles(selectedFiles.length);
    setCurrentFileIndex(0);

    try {
      const uploadedImages: ProjectImage[] = [];
      const failedUploads: string[] = [];
      const maxRetries = 2;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentFileIndex(i);
        // Calculate progress percentage based on current file index
        setUploadProgress(Math.round((i / selectedFiles.length) * 100));
        
        let uploaded = false;
        let retries = 0;

        while (!uploaded && retries < maxRetries) {
          try {
            const res = await uploadFiles("imageUploader", {
              files: [file], // Upload one file at a time
            });

            if (res && res.length > 0) {
              const uploadedFile = res[0];
              const newImage: ProjectImage = {
                id: crypto.randomUUID(),
                url: uploadedFile.ufsUrl || uploadedFile.url,
                fileKey:
                  uploadedFile.key ||
                  (uploadedFile.ufsUrl || uploadedFile.url).split("/").pop() ||
                  crypto.randomUUID(),
                alt: null,
              };
              uploadedImages.push(newImage);
              uploaded = true;
            }
          } catch (error: any) {
            console.error(
              `Failed to upload file ${file.name} (attempt ${retries + 1}):`,
              error
            );
            retries++;

            // Last retry failed
            if (retries >= maxRetries) {
              failedUploads.push(file.name);
            }

            // Small delay before retry
            if (!uploaded && retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
      }

      // Set to 100% when complete
      setUploadProgress(100);

      // Handle results
      if (uploadedImages.length > 0) {
        setPhaseImages((prev) => [...prev, ...uploadedImages]);
        toast.success(
          `${uploadedImages.length} image(s) uploaded successfully`
        );
      }

      if (failedUploads.length > 0) {
        toast.error(`Failed to upload: ${failedUploads.join(", ")}`);
      }

      setSelectedFiles([]);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(`Upload process error: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Separate upload dialog component

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
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Phase Title</h3>
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
                              placeholder="Enter phase title"
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
                              placeholder="Enter Slovenian phase title"
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
                              placeholder="Enter Croatian phase title"
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

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Phase Description</h3>
                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="sl">Slovenian</TabsTrigger>
                    <TabsTrigger value="hr">Croatian</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="mt-0">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
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
                  </TabsContent>

                  <TabsContent value="sl" className="mt-0">
                    <FormField
                      control={form.control}
                      name="description_sl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              disabled={isLoading}
                              placeholder="Describe this phase in Slovenian"
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
                      name="description_hr"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              disabled={isLoading}
                              placeholder="Describe this phase in Croatian"
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

              <FormItem>
                <FormLabel>Phase Images</FormLabel>
                <div className="space-y-6">
                  {/* Gallery Grid */}
                  {phaseImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {phaseImages.map((image) => (
                        <div
                          key={image.id}
                          className="group relative aspect-square rounded-lg overflow-hidden border"
                        >
                          <Image
                            src={image.url}
                            alt={image.alt || "Phase image"}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => {
                                setPhaseImages(
                                  phaseImages.filter(
                                    (img) => img.id !== image.id
                                  )
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Section */}
                  <div className="flex flex-col items-center border-2 border-dashed rounded-lg p-6">
                    <div
                      {...getRootProps()}
                      className="w-full h-32 flex flex-col items-center justify-center cursor-pointer"
                    >
                      <input {...getInputProps()} />
                      {isDragActive ? (
                        <p>Drop the files here ...</p>
                      ) : (
                        <p>
                          Drag & drop some files here, or click to select files
                        </p>
                      )}
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 w-full">
                        <h4 className="text-sm font-medium">Selected Files:</h4>
                        <ul className="list-disc list-inside">
                          {selectedFiles.map((file, index) => (
                            <li key={index}>
                              {file.name} - {(file.size / 1024).toFixed(2)} KB
                            </li>
                          ))}
                        </ul>
                        <div className="space-y-2 w-full">
                          <Button
                            onClick={handleUpload}
                            disabled={isUploading || isLoading}
                            className="mt-4 w-full"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading {uploadProgress}% - File {currentFileIndex + 1}/{totalFiles}
                              </>
                            ) : (
                              "Upload Selected Images"
                            )}
                          </Button>
                          
                          {isUploading && (
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300 ease-in-out" 
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                    setPhaseImages([]);
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
                            {phase.media && phase.media.length > 0 && (
                              <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                <Image
                                  src={phase.media[0].url}
                                  alt={phase.media[0].alt || phase.title}
                                  fill
                                  className="object-cover"
                                />
                                {phase.media.length > 1 && (
                                  <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                                    +{phase.media.length - 1}
                                  </div>
                                )}
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

"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogVisuallyHidden } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useLanguage } from "@/store/language-context";
import { getLocalizedContent } from "@/lib/language-utils";
import { Teacher as TeacherType } from "@/lib/types";
import { SupportedLanguage } from "@/store/language-context";

interface TeacherDialogProps {
  teacher: TeacherType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: SupportedLanguage;
}

export function TeacherDialog({
  teacher,
  open,
  onOpenChange,
  language: propLanguage,
}: TeacherDialogProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const languageContext = useLanguage();

  // Use language from props if provided, otherwise use context
  const language = propLanguage || languageContext.language;

  React.useEffect(() => {
    setImageLoaded(false);
  }, [open, teacher?.id]);

  if (!teacher) return null;

  const title = getLocalizedContent(teacher, "title", language);
  const bio = getLocalizedContent(teacher, "bio", language);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-4xl overflow-hidden">
        <DialogVisuallyHidden>
          <DialogTitle>{teacher.name} - Teacher Profile</DialogTitle>
        </DialogVisuallyHidden>
        <div className="flex flex-col lg:flex-row max-h-[85vh]">
          {/* Left Column - Photo and Basic Info */}
          <div className="bg-muted p-6 lg:w-[280px] flex-shrink-0">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-background shadow-lg mb-4 bg-muted relative flex-shrink-0">
                {teacher.photo ? (
                  <>
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl lg:text-5xl font-semibold text-primary/20">
                          {teacher.name[0]}
                        </span>
                      </div>
                    )}
                    <Image
                      src={teacher.photo.url}
                      alt={teacher.name}
                      width={160}
                      height={160}
                      className={`object-cover w-full h-full transition-opacity duration-300 ${
                        imageLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      onLoadingComplete={() => setImageLoaded(true)}
                      priority
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="text-4xl lg:text-5xl font-semibold text-primary">
                      {teacher.name[0]}
                    </span>
                  </div>
                )}
              </div>

              <h2 className="text-xl lg:text-2xl font-semibold">
                {teacher.name}
              </h2>
              {title && (
                <Badge variant="secondary" className="mt-2">
                  {title}
                </Badge>
              )}

              {teacher.email && (
                <div className="mt-6 w-full">
                  <div className="flex items-center gap-2 text-sm bg-background p-3 rounded-md">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground truncate">
                      {teacher.email}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Bio and Details */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5" />
                    {language === "en" && "About"}
                    {language === "sl" && "O učitelju"}
                    {language === "hr" && "O učitelju"}
                  </h3>
                  <Separator className="mb-2" />
                  <p className="text-muted-foreground text-justify leading-relaxed">
                    {bio || (
                      <>
                        {language === "en" && "No bio available"}
                        {language === "sl" && "Biografija ni na voljo"}
                        {language === "hr" && "Životopis nije dostupan"}
                      </>
                    )}
                  </p>
                </div>
                <Separator />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

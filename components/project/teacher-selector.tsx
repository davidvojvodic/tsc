// components/project/teacher-selector.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChevronsUpDown, X } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Teacher {
  id: string;
  name: string;
  photo?: {
    url: string;
  } | null;
}

interface TeacherSelectorProps {
  value: string[]; // Array of selected teacher IDs
  onChange: (value: string[]) => void;
  availableTeachers: Teacher[];
  isLoading?: boolean;
}

export function TeacherSelector({
  value,
  onChange,
  availableTeachers,
  isLoading = false,
}: TeacherSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTeachers = availableTeachers.filter((teacher) =>
    value.includes(teacher.id)
  );

  const handleTeacherToggle = (teacherId: string) => {
    if (isLoading) return; // Don't allow changes when loading

    const isSelected = value.includes(teacherId);
    if (isSelected) {
      onChange(value.filter((id) => id !== teacherId));
      toast.success("Teacher removed from project");
    } else {
      onChange([...value, teacherId]);
      toast.success("Teacher added to project");
    }

    // Leave the dropdown open to allow selecting multiple teachers
    // and close it only if there are no more unselected teachers
    if (unselectedTeachers.length <= 1) {
      setOpen(false);
    }
  };

  // Filter out already selected teachers from the available list
  const unselectedTeachers = availableTeachers.filter(
    (teacher) => !value.includes(teacher.id)
  );

  // Filter teachers based on search query
  const filteredTeachers = searchQuery
    ? unselectedTeachers.filter((teacher) =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : unselectedTeachers;

  if (!mounted) {
    return null; // Don't render anything until component is mounted
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Teachers</CardTitle>
        <CardDescription>
          {availableTeachers.length > 0
            ? "Assign teachers to collaborate on this project"
            : "No teachers available to assign to this project"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isLoading}
              >
                {`${selectedTeachers.length} teacher${
                  selectedTeachers.length !== 1 ? "s" : ""
                } selected`}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="max-h-[300px] overflow-y-auto p-2">
                {/* Search input */}
                <div className="flex items-center border-b px-3 mb-2">
                  <input
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search teachers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Teacher list */}
                {filteredTeachers.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {selectedTeachers.length === availableTeachers.length
                      ? "All teachers have been selected."
                      : "No matching teachers found."}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        onClick={() => handleTeacherToggle(teacher.id)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={teacher.photo?.url} />
                          <AvatarFallback>
                            {teacher.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{teacher.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {selectedTeachers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTeachers.map((teacher) => (
                <Badge
                  key={teacher.id}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={teacher.photo?.url} />
                    <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {teacher.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                    onClick={() => handleTeacherToggle(teacher.id)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

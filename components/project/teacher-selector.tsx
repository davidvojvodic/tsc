// components/project/teacher-selector.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronsUpDown, X } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

  const selectedTeachers = availableTeachers.filter((teacher) =>
    value.includes(teacher.id)
  );

  const handleTeacherToggle = (teacherId: string) => {
    const isSelected = value.includes(teacherId);
    if (isSelected) {
      onChange(value.filter((id) => id !== teacherId));
      toast.success("Teacher removed from project");
    } else {
      onChange([...value, teacherId]);
      toast.success("Teacher added to project");
    }
    setOpen(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Teachers</CardTitle>
        <CardDescription>
          Assign teachers to collaborate on this project
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
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No teachers found.</CommandEmpty>
                  <CommandGroup>
                    {filteredTeachers.map((teacher) => (
                      <CommandItem
                        key={teacher.id}
                        value={teacher.id}
                        onSelect={() => handleTeacherToggle(teacher.id)}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={teacher.photo?.url} />
                          <AvatarFallback>
                            {teacher.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{teacher.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
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

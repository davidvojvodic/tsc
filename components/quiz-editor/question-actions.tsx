"use client";

import { MoreHorizontal, Copy, Trash2, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface QuestionActionsProps {
  onDuplicate: () => void;
  onDelete: () => void;
  onConvert: () => void;
}

export function QuestionActions({
  onDuplicate,
  onDelete,
  onConvert
}: QuestionActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onDuplicate} className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicate Question
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onConvert} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Convert Type
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-2 text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete Question
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
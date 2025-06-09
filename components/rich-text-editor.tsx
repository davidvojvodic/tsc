import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import React, { useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  RemoveFormatting,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FontSize } from "@/lib/font-size";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

const fontSizes = [
  { value: "0.875rem", label: "Small" },
  { value: "1rem", label: "Normal" },
  { value: "1.25rem", label: "Large" },
  { value: "1.5rem", label: "XL" },
  { value: "1.875rem", label: "2XL" },
  { value: "2.25rem", label: "3XL" },
];

function ToolbarButton({
  onClick,
  disabled,
  active,
  tooltip,
  children,
}: ToolbarButtonProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <button
              type="button"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                onClick();
              }}
              className={cn(
                "h-8 w-8 p-0 rounded-md hover:bg-primary hover:text-white",
                "inline-flex items-center justify-center",
                active && "bg-primary text-white",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {children}
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p className="text-xs capitalize">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface LinkDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LinkDialog({ editor, open, onOpenChange }: LinkDialogProps) {
  const [url, setUrl] = useState("");

  const addLink = () => {
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
    onOpenChange(false);
    setUrl("");
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    onOpenChange(false);
    setUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>
        <DialogFooter>
          {editor.isActive("link") && (
            <Button
              type="button"
              variant="outline"
              onClick={removeLink}
              className="mr-auto"
            >
              Remove Link
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={addLink}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  disabled = false,
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      const html = editor.getHTML();
      if (html !== value) {
        onChange(html);
      }
    },
    [onChange, value]
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
            HTMLAttributes: {
              class: "list-disc ml-4",
            },
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
            HTMLAttributes: {
              class: "list-decimal ml-4",
            },
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: "is-editor-empty",
        }),
        TextStyle,
        FontSize.configure(),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class:
              "text-primary underline underline-offset-4 hover:text-primary/80",
          },
        }),
      ],
      content: value,
      editable: !disabled,
      onUpdate: handleUpdate,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm dark:prose-invert max-w-none min-h-[150px] px-3 py-2 outline-none",
            disabled && "opacity-50 cursor-not-allowed"
          ),
        },
      },
    },
    []
  );

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const getCurrentFontSize = () => {
    const attrs = editor.getAttributes("textStyle");
    return attrs.fontSize || "1rem";
  };

  const handleFontSizeChange = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
  };

  return (
    <div
      className={cn(
        "relative rounded-md border bg-background",
        isFocused && "ring-2 ring-ring ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="border-b bg-muted px-2 py-1">
        <div className="flex flex-wrap gap-1 items-center">
          <Select
            value={getCurrentFontSize()}
            onValueChange={handleFontSizeChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
              {fontSizes.map((size) => (
                <SelectItem
                  key={size.value}
                  value={size.value}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="mx-1 h-8" />

          {/* Text Format Buttons */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
              active={editor.isActive("bold")}
              tooltip="Bold (⌘+B)"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
              active={editor.isActive("italic")}
              tooltip="Italic (⌘+I)"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="mx-1 h-8" />

          {/* List Buttons */}
          <div className="flex">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={disabled}
              active={editor.isActive("bulletList")}
              tooltip="Bullet List"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={disabled}
              active={editor.isActive("orderedList")}
              tooltip="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            active={editor.isActive("blockquote")}
            tooltip="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setLinkDialogOpen(true)}
            disabled={disabled}
            active={editor.isActive("link")}
            tooltip="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="flex-1" />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            disabled={disabled}
            tooltip="Clear Formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-8" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo() || disabled}
            tooltip="Undo"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo() || disabled}
            tooltip="Redo"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      <EditorContent
        editor={editor}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <LinkDialog
        editor={editor}
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
      />
    </div>
  );
}

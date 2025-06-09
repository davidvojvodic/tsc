// components/rich-text-display.tsx
import { cn } from "@/lib/utils";

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  if (!content) return null;

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        // Typographic adjustments
        "prose-headings:scroll-m-20",
        "prose-h1:text-3xl prose-h1:font-bold prose-h1:tracking-tight",
        "prose-h2:text-2xl prose-h2:font-semibold prose-h2:tracking-tight",
        "prose-h3:text-xl prose-h3:font-semibold prose-h3:tracking-tight",
        "prose-p:leading-7",
        "prose-li:marker:text-muted-foreground",
        // Spacing adjustments
        "prose-p:my-2",
        "prose-headings:mb-4 prose-headings:mt-8",
        "prose-hr:my-4",
        "prose-blockquote:my-4 prose-blockquote:border-l-2 prose-blockquote:pl-4",
        // Colors and styling
        "prose-a:text-primary prose-a:underline prose-a:underline-offset-2",
        "prose-blockquote:border-muted-foreground/50",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5",
        "prose-pre:rounded-lg prose-pre:bg-muted prose-pre:p-4",
        // Text wrapping and overflow handling
        "break-words overflow-wrap-anywhere",
        "prose-p:break-words prose-headings:break-words prose-li:break-words",
        "prose-a:break-all prose-code:break-all",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

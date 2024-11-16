// components/admin/sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  LayoutDashboard,
  FileText,
  BookOpen,
  Tags,
  FolderTree,
  Settings,
  ImageIcon,
  GraduationCap,
  BrainCircuit,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    color: "text-sky-500",
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
    color: "text-violet-500",
  },
  {
    label: "Posts",
    icon: FileText,
    href: "/admin/posts",
    color: "text-pink-700",
  },
  {
    label: "Pages",
    icon: BookOpen,
    href: "/admin/pages",
    color: "text-orange-500",
  },
  {
    label: "Categories",
    icon: FolderTree,
    href: "/admin/categories",
    color: "text-emerald-500",
  },
  {
    label: "Tags",
    icon: Tags,
    href: "/admin/tags",
    color: "text-green-500",
  },
  {
    label: "Media",
    icon: ImageIcon,
    href: "/admin/media",
    color: "text-blue-500",
  },
  {
    label: "Teachers",
    icon: GraduationCap,
    href: "/admin/teachers",
    color: "text-yellow-500",
  },
  {
    label: "Quizzes",
    icon: BrainCircuit,
    href: "/admin/quizzes",
    color: "text-purple-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
    color: "text-gray-500",
  },
];

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: typeof routes;
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex space-y-1 flex-col", className)} {...props}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              pathname === item.href
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "gap-x-3"
            )}
            asChild
          >
            <Link href={item.href}>
              <Icon className={cn("h-4 w-4", item.color)} />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

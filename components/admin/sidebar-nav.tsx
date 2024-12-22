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
  FolderTree,
  ImageIcon,
  GraduationCap,
  BrainCircuit,
  FolderKanban,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    color: "text-sky-500",
    isActive: true,
  },
  {
    label: "Users",
    icon: Users,
    href: "/admin/users",
    color: "text-violet-500",
    isActive: true,
  },
  {
    label: "Posts",
    icon: FileText,
    href: "/admin/posts",
    color: "text-pink-700",
    isActive: false,
  },
  {
    label: "Projects",
    icon: FolderKanban,
    href: "/admin/projects",
    color: "text-cyan-500",
    isActive: true,
  },

  {
    label: "Resources",
    icon: FolderTree,
    href: "/admin/materials",
    color: "text-emerald-500",
    isActive: true,
  },

  {
    label: "Media",
    icon: ImageIcon,
    href: "/admin/media",
    color: "text-blue-500",
    isActive: false,
  },
  {
    label: "Teachers",
    icon: GraduationCap,
    href: "/admin/teachers",
    color: "text-yellow-500",
    isActive: true,
  },
  {
    label: "Quizzes",
    icon: BrainCircuit,
    href: "/admin/quizzes",
    color: "text-purple-500",
    isActive: true,
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

        if (item.isActive) {
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
        }

        return (
          <Button
            key={item.href}
            variant="ghost"
            className="w-full justify-start gap-x-3 cursor-not-allowed opacity-60"
            disabled
          >
            <Icon className={cn("h-4 w-4", item.color)} />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}

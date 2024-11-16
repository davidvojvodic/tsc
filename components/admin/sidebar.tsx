import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import Link from "next/link";
import { routes } from "./sidebar-nav";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <Link href="/admin" className="flex items-center mb-14">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </Link>
          <div className="space-y-1">
            <SidebarNav items={routes} />
          </div>
        </div>
      </div>
    </div>
  );
}

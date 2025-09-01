import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import Link from "next/link";
import { routes } from "./sidebar-nav";
import { Button } from "../ui/button";
import { Home } from "lucide-react";
import { Separator } from "../ui/separator";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-3 px-3">
        <Link href="/" className="flex items-center w-full">
          <Button variant={"secondary"} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <Separator />
      <div className="px-3 py-2">
        <div className="space-y-1">
          <SidebarNav items={routes} />
        </div>
      </div>
    </div>
  );
}

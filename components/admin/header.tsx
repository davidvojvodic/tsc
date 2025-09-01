// components/admin/header.tsx
import { UserNav } from "./user-nav";
// import { ModeToggle } from "@/components/ui/mode-toggle";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader({ email }: { email: string }) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
          {/* <ModeToggle /> */}
          <UserNav email={email} />
        </div>
      </div>
    </div>
  );
}

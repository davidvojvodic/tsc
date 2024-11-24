"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";

interface ProfileDropdownProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: "ADMIN" | "TEACHER" | "USER";
  };
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsSigningOut(false);
    }
  };

  const isAuthorized = user.role === "ADMIN" || user.role === "TEACHER";

  return (
    <>
      {/* Desktop Menu */}
      <div className="hidden md:flex md:items-center md:gap-x-4">
        {isAuthorized && (
          <Button variant="outline" asChild>
            <Link href="/admin" className="flex items-center gap-x-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/account" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Menu Items */}
      <div className="md:hidden flex flex-col gap-2 pt-4">
        {isAuthorized && (
          <Button variant="outline" asChild>
            <Link href="/admin" className="flex items-center gap-x-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback>
              {user.name?.charAt(0) || user.email.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name || "User"}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/account">Profile Settings</Link>
        </Button>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-red-600 hover:text-red-600 hover:bg-red-100"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </>
  );
}

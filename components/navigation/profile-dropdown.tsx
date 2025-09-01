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
import { useLanguage } from "@/store/language-context";
import { SupportedLanguage } from "@/store/language-context";

interface ProfileDropdownProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: "ADMIN" | "TEACHER" | "USER";
  };
  language?: SupportedLanguage;
}

const getTranslations = (language: string) => {
  const translations = {
    en: {
      dashboard: "Dashboard",
      profile: "Profile",
      profileSettings: "Profile Settings",
      signOut: "Sign out",
      signingOut: "Signing out...",
      signOutSuccess: "Signed out successfully",
      account: "Account",
      admin: "Admin Dashboard",
    },
    sl: {
      dashboard: "Nadzorna plošča",
      profile: "Profil",
      profileSettings: "Nastavitve profila",
      signOut: "Odjava",
      signingOut: "Odjavljanje...",
      signOutSuccess: "Uspešna odjava",
      account: "Račun",
      admin: "Skrbniška plošča",
    },
    hr: {
      dashboard: "Nadzorna ploča",
      profile: "Profil",
      profileSettings: "Postavke profila",
      signOut: "Odjava",
      signingOut: "Odjava u tijeku...",
      signOutSuccess: "Uspješna odjava",
      account: "Račun",
      admin: "Administratorska ploča",
    },
  };

  return translations[language as keyof typeof translations] || translations.en;
};

export function ProfileDropdown({
  user,
  language: serverLanguage,
}: ProfileDropdownProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const languageContext = useLanguage();

  // Use server-provided language (for server components) or client context language
  const language = serverLanguage || languageContext.language;
  const t = getTranslations(language);

  // Generate language-specific links for account
  const prefix = language === "en" ? "" : `/${language}`;
  const accountLink = `${prefix}/account`;
  // Admin dashboard should always go to /admin (non-localized)
  const adminLink = "/admin";

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      toast.success(t.signOutSuccess);
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
            <Link href={adminLink} className="flex items-center gap-x-2">
              <LayoutDashboard className="h-4 w-4" />
              {t.dashboard}
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
                <Link href={accountLink} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t.profile}</span>
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
              <span>{isSigningOut ? t.signingOut : t.signOut}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Menu Items */}
      <div className="flex flex-col gap-2 md:hidden">
        {isAuthorized && (
          <Button variant="outline" asChild className="justify-start">
            <Link href={adminLink} className="flex items-center gap-x-2">
              <LayoutDashboard className="h-4 w-4" />
              {t.dashboard}
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-10 w-10">
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
        <Button variant="ghost" asChild className="justify-start">
          <Link href={accountLink} className="flex items-center gap-x-2">
            <User className="h-4 w-4" />
            {t.profileSettings}
          </Link>
        </Button>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="justify-start text-red-600 hover:text-red-600 hover:bg-red-100"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? t.signingOut : t.signOut}
        </Button>
      </div>
    </>
  );
}

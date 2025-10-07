import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Container } from "../container";
import { ProfileDropdown } from "./profile-dropdown";
import { LanguageSelector } from "@/components/language-selector";
import { SupportedLanguage } from "@/store/language-context";
import { Separator } from "@/components/ui/separator";

const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      about: "About Us",
      projects: "Our Projects",
      waterwise: "WaterWise",
      resources: "Resources",
      learning: "Online Learning",
      login: "Log In",
      signup: "Sign Up",
      mobileMenu: "Menu",
      home: "Home",
    },
    sl: {
      about: "O nas",
      projects: "Naši projekti",
      waterwise: "WaterWise",
      resources: "Gradiva",
      learning: "Spletno učenje",
      login: "Prijava",
      signup: "Registracija",
      mobileMenu: "Meni",
      home: "Domov",
    },
    hr: {
      about: "O nama",
      projects: "Naši projekti",
      waterwise: "WaterWise",
      resources: "Materijali",
      learning: "Online učenje",
      login: "Prijava",
      signup: "Registracija",
      mobileMenu: "Izbornik",
      home: "Početna",
    },
  };

  return translations[language];
};

// Get translated links for the current language
const getNavigationLinks = (language: SupportedLanguage) => {
  const t = getTranslations(language);

  // Base paths without language prefix
  const basePaths = {
    home: "/",
    projects: "/projects",
    waterwise: "/projects/WaterWise",
    materials: "/materials",
    quizzes: "/quizzes",
    account: "/account",
  };

  // If we're not in English, prefix all paths with language code
  const prefix = language === "en" ? "" : `/${language}`;

  const paths = {
    home: `${prefix}${basePaths.home}`,
    projects: `${prefix}${basePaths.projects}`,
    waterwise: `${prefix}${basePaths.waterwise}`,
    materials: `${prefix}${basePaths.materials}`,
    quizzes: `${prefix}${basePaths.quizzes}`,
    account: `${prefix}${basePaths.account}`,
  };

  // Create navigation items with translated names and language-aware paths
  return [
    { name: t.about, href: paths.home },
    { name: t.projects, href: paths.projects },
    { name: t.waterwise, href: paths.waterwise },
    { name: t.resources, href: paths.materials },
    { name: t.learning, href: paths.quizzes },
  ];
};

async function getUserWithRole() {
  const headersObj = await headers();
  const session = await auth.api.getSession({
    headers: headersObj,
  });

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
    },
  });

  return user;
}

export async function Navbar() {
  const user = await getUserWithRole();

  // Get current language from cookies
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("NEXT_LOCALE");
  const language = (langCookie?.value || "en") as SupportedLanguage;

  // Get translations
  const t = getTranslations(language);

  // Get navigation with translated links
  const navigation = getNavigationLinks(language);

  // Generate links - now all routes including auth have language prefixes
  const prefix = language === "en" ? "" : `/${language}`;
  const loginLink = `${prefix}/login`;
  const registerLink = `${prefix}/register`;
  const homeLink = `${prefix}/`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <nav className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Link href={homeLink}>
              <Image
                src="/waterwise.png"
                alt="WaterWise Logo"
                width={100}
                height={40}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons & Language Selector */}
          <div className="flex items-center gap-x-4">
            {/* Language selector - Only visible on desktop */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* Auth buttons or profile dropdown - Only visible on desktop */}
            {user ? (
              <div className="hidden md:block">
                <ProfileDropdown user={user} language={language} />
              </div>
            ) : (
              <div className="hidden md:flex md:items-center md:gap-x-4">
                <Button asChild>
                  <Link href={loginLink}>{t.login}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={registerLink}>{t.signup}</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button - Always visible on mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{t.mobileMenu}</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-[300px] flex-col p-0"
              >
                <SheetHeader className="px-6 py-4 border-b">
                  <SheetTitle>
                    <Image
                      src="/waterwise.png"
                      alt="WaterWise Logo"
                      width={100}
                      height={40}
                      priority
                    />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-auto">
                  {/* Navigation Links */}
                  <div className="flex flex-col gap-1 px-2 py-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center rounded-md px-4 py-3 text-base font-medium text-foreground/70 hover:bg-muted transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  <Separator />

                  {/* Language Selector */}
                  <div className="px-6 py-4">
                    <p className="text-sm font-medium mb-2 text-muted-foreground">
                      {language === "en" && "Language"}
                      {language === "sl" && "Jezik"}
                      {language === "hr" && "Jezik"}
                    </p>
                    <LanguageSelector />
                  </div>

                  <Separator />

                  {/* Auth Section */}
                  {user ? (
                    <div className="px-2 py-4">
                      <ProfileDropdown user={user} language={language} />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 p-6">
                      <Button asChild>
                        <Link href={loginLink}>{t.login}</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={registerLink}>{t.signup}</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </Container>
    </header>
  );
}

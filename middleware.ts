// middleware.ts - Fixed version

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LANGUAGES = ["en", "sl", "hr"];
const DEFAULT_LANGUAGE = "en";

// Add paths that should bypass language routing
const EXCLUDED_PATHS = [
  "/admin", 
  "/api", 
  "/_next", 
  "/favicon.ico",
  "/hero-upscaled.png",
  "/hero.png", 
  "/school-start-times.jpg", 
  "/waterwise.png"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip language routing for admin and other excluded paths - explicit check for admin paths
  // This is what needs to be fixed
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  // Check other excluded paths
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if the pathname already has a language prefix
  const pathnameHasLanguage = SUPPORTED_LANGUAGES.some(
    (lang) => pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`
  );

  if (pathnameHasLanguage) return NextResponse.next();

  // Get language from cookie or localStorage if available
  const userLang =
    request.cookies.get("preferredLanguage")?.value || DEFAULT_LANGUAGE;

  // Redirect to the same URL but with language prefix
  const url = request.nextUrl.clone();
  url.pathname = `/${userLang}${pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Explicitly exclude admin routes and static files from the matcher
    "/((?!admin|api|_next/static|_next/image|favicon.ico|hero-upscaled.png|hero.png|school-start-times.jpg|waterwise.png).*)",
  ],
};
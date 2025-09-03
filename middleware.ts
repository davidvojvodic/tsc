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
  "/optimized",
  // Add common static file paths
  "/images",
  "/icons",
  "/fonts",
  "/public",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  // Skip language routing for admin and other excluded paths - explicit check for admin paths
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

  if (pathnameHasLanguage) {
    // If path already has language prefix, ensure cookie is set to match URL language
    const pathLang = pathname.split("/")[1];
    if (SUPPORTED_LANGUAGES.includes(pathLang)) {
      const response = NextResponse.next();
      const currentCookie = request.cookies.get("NEXT_LOCALE")?.value;

      // Only set cookie if it's different from current
      if (currentCookie !== pathLang) {
        response.cookies.set("NEXT_LOCALE", pathLang, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }

      return response;
    }

    return NextResponse.next();
  }

  // Get language from cookie
  let userLang = request.cookies.get("NEXT_LOCALE")?.value;

  // If no cookie, check the Accept-Language header
  if (!userLang) {
    const acceptLanguage = request.headers.get("Accept-Language") || "";
    const browserLang = acceptLanguage
      .split(",")[0]
      .split("-")[0]
      .toLowerCase();

    userLang = SUPPORTED_LANGUAGES.includes(browserLang as any)
      ? browserLang
      : DEFAULT_LANGUAGE;
  }

  // Ensure we have a valid language
  if (!SUPPORTED_LANGUAGES.includes(userLang as any)) {
    userLang = DEFAULT_LANGUAGE;
  }

  // Redirect to the same URL but with language prefix
  const url = request.nextUrl.clone();
  url.pathname = `/${userLang}${pathname === "/" ? "" : pathname}`;

  // Set language cookie in the response
  const response = NextResponse.redirect(url);
  response.cookies.set("NEXT_LOCALE", userLang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

export const config = {
  matcher: [
    // Match all routes except API, static files, and Next.js internals
    // Static files in /public (including /optimized) should be served directly by Next.js
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.ico|.*\\.css|.*\\.js).*)",
  ],
};

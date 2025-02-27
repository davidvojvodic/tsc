// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supportedLanguages = ["en", "sl", "hr"];
const defaultLanguage = "en";

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;

  // Only redirect the root path to the default language
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLanguage}`;
    return NextResponse.redirect(url);
  }

  // For all other paths, let Next.js handle it
  return NextResponse.next();
}

// Run middleware only on the homepage
export const config = {
  matcher: ["/"],
};

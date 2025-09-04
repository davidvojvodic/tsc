import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

export const { POST, GET } = toNextJsHandler(auth);

// Manual OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  
  const allowedOrigins = [
    "https://ka2.tscmb.si",
    "https://ka2-waterwise.eu",
    "https://www.ka2-waterwise.eu",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ].filter(Boolean);
  
  // Check if origin is allowed
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin);
  
  if (!isAllowedOrigin) {
    return new NextResponse(null, { status: 403 });
  }
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET,DELETE,PATCH,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}

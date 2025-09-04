import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || "development";

export function getBaseURL() {
  // Use current origin if in browser to avoid cross-origin requests
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  // Fallback to environment variables for server-side
  switch (environment) {
    case "development":
      return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    case "preview":
      return (
        process.env.NEXT_PUBLIC_TEST_APP_URL || "https://ka2-waterwise.eu"
      );
    case "production":
      return process.env.NEXT_PUBLIC_PROD_APP_URL || "https://ka2-waterwise.eu";
    default:
      return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }
}

const baseURL = getBaseURL();

if (!baseURL && environment === "production") {
  throw new Error(
    "Production app URL must be defined in environment variables"
  );
}

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: { credentials: "include" },
  plugins: [adminClient()],
});

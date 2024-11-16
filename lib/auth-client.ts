import { createAuthClient } from "better-auth/react";

const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || "development";

function getBaseURL() {
  switch (environment) {
    case "development":
      return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    case "preview":
      return (
        process.env.NEXT_PUBLIC_TEST_APP_URL || "https://tsc-testing.vercel.app"
      );
    case "production":
      return process.env.NEXT_PUBLIC_PROD_APP_URL;
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
});

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { getBaseURL } from "./auth-client";
import { admin } from "better-auth/plugins";
import { createPasswordResetEmailHtml, sendEmail } from "./email";
import { validateEnvironmentVariables } from "./auth-utils";

// Validate environment variables at module initialization
validateEnvironmentVariables();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  secret: (() => {
    if (!process.env.BETTER_AUTH_SECRET) {
      throw new Error("BETTER_AUTH_SECRET environment variable is required and must be set");
    }
    return process.env.BETTER_AUTH_SECRET;
  })(),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day  
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes
    }
  },
  cookies: {
    sessionToken: {
      name: "better-auth.session_token",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      if (!user?.email) {
        console.error("Missing required data for password reset");
        throw new Error("Missing required data for password reset");
      }

      const html = createPasswordResetEmailHtml(url);

      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click this link to reset your password: ${url}?token=${token}`,
        html,
      });
    },
  },
  baseURL: getBaseURL(),
  plugins: [
    admin({
      defaultRole: "USER",
    }),
  ],
  rateLimit: {
    window: 60, // 1 minute
    max: 100 // 100 requests per minute
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    crossSubDomainCookies: {
      enabled: false // Disable for security
    }
  },
  cors: {
    origin: [
      "https://ka2.tscmb.si",
      "https://ka2-waterwise.eu",
      "https://www.ka2-waterwise.eu",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ].filter(Boolean),
    credentials: true,
  },
  trustedOrigins: [
    "https://ka2.tscmb.si",
    "https://ka2-waterwise.eu",
    "https://www.ka2-waterwise.eu",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ].filter(Boolean),
});

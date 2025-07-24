import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { getBaseURL } from "./auth-client";
import { admin } from "better-auth/plugins";
import { createPasswordResetEmailHtml, sendEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
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
  cors: {
    origin: [
      "https://ka2.tscmb.si",
      "https://tsc-testing.vercel.app",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ].filter(Boolean),
    credentials: true,
  },
  trustedOrigins: [
    "https://ka2.tscmb.si",
    "https://tsc-testing.vercel.app",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ].filter(Boolean),
});

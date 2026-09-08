// Edge-safe part of the auth config (no Prisma). Used by proxy.ts and auth.ts.
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN ?? "providentestate.com").toLowerCase();

export function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${allowedDomain}`);
}

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

export const authConfig = {
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;

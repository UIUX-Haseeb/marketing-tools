// Edge-safe part of the auth config (no Prisma). Used by proxy.ts and auth.ts.
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN ?? "providentestate.com").toLowerCase();

export function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${allowedDomain}`);
}

export const authConfig = {
  providers: [
    Google({
      authorization: { params: { hd: allowedDomain, prompt: "select_account" } },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;

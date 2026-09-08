// Edge-safe part of the auth config (no Prisma). Used by proxy.ts and auth.ts.
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";


export function isAllowedEmail(email?: string | null) {
  return !!email;
}

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || "s6sWAyD7VNs+gD6XOjbHwdMfNvcsQz0KftjfPLKBKhkU",
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

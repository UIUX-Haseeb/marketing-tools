// Next.js 16 request proxy (formerly middleware): gate every page behind sign-in.
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export function proxy(req: NextRequest) {
  // `auth` acts as middleware: redirects to /login when `authorized()` returns false.
  return (auth as unknown as (req: NextRequest) => Promise<Response>)(req);
}

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|post-assets|mascot|.*\\.(?:png|svg|jpg|jpeg|webp|ico|woff2?|mp4)$).*)"],
};

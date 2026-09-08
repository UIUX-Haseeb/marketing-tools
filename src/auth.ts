import NextAuth, { type DefaultSession } from "next-auth";
import "next-auth/jwt";
import { authConfig, isAllowedEmail } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import type { Team, Role } from "@/lib/teams";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      team: Team;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    team?: Team;
    role?: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    // Only company Google accounts, and only people on the admin-managed user list.
    async signIn({ user }) {
      if (!isAllowedEmail(user.email)) return "/login?error=domain";
      const dbUser = await prisma.user.findUnique({ where: { email: user.email!.toLowerCase() } });
      if (!dbUser || !dbUser.active) return "/login?error=notlisted";
      return true;
    },

    async jwt({ token, user, trigger }) {
      // On sign-in (and on session.update()) refresh team/role from the DB.
      if (user?.email || trigger === "update") {
        const email = (user?.email ?? token.email)?.toLowerCase();
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) {
            token.uid = dbUser.id;
            token.team = dbUser.team;
            token.role = dbUser.role;
            if (user?.name || user?.image) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { name: dbUser.name ?? user.name, image: user.image ?? dbUser.image },
              });
            }
          }
        }
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.uid ?? "";
      session.user.team = token.team ?? "OTHER";
      session.user.role = token.role ?? "MEMBER";
      return session;
    },
  },
});

/** Server-side helper: current user or redirect to login. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session!.user;
}

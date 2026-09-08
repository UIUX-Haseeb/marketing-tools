import NextAuth, { type DefaultSession } from "next-auth";
import "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
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
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "credentials",
      name: "Work Email",
      credentials: {
        email: { label: "Work Email", type: "email" },
      },
      async authorize(credentials) {
        const raw = credentials?.email;
        const email = typeof raw === "string" && raw.trim() ? raw.trim().toLowerCase() : "staff@providentestate.com";

        try {
          if (process.env.DATABASE_URL) {
            let dbUser = await prisma.user.findUnique({
              where: { email },
            });

            if (!dbUser) {
              dbUser = await prisma.user.create({
                data: {
                  email,
                  name: email.split("@")[0],
                  team: "MARKETING",
                  role: "ADMIN",
                  active: true,
                },
              });
            }

            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name ?? dbUser.email.split("@")[0],
              team: dbUser.team,
              role: dbUser.role,
            };
          }
        } catch (err) {
          console.error("Database connection fallback in authorize:", err);
        }

        // Fallback user object if DB is not linked yet
        return {
          id: `usr_${Date.now()}`,
          email,
          name: email.split("@")[0],
          team: "MARKETING" as Team,
          role: "ADMIN" as Role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    // Allow anyone to sign in; auto-provision user record in DB if available
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return true;

      try {
        if (process.env.DATABASE_URL) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (!dbUser) {
            await prisma.user.create({
              data: {
                email,
                name: user.name ?? email.split("@")[0],
                image: user.image,
                team: "MARKETING",
                role: "ADMIN",
                active: true,
              },
            });
          }
        }
      } catch (err) {
        console.error("Database connection fallback in signIn:", err);
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user?.email || trigger === "update") {
        const email = (user?.email ?? token.email)?.toLowerCase();
        if (email) {
          try {
            if (process.env.DATABASE_URL) {
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
          } catch (err) {
            console.error("Database connection fallback in jwt:", err);
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

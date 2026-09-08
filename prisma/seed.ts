import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// First admin(s). Add more from /admin/users once signed in.
const seedUsers = [
  { email: "marketing.uiux@providentestate.com", name: "Irma", team: "MARKETING", role: "ADMIN" },
] as const;

async function main() {
  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { team: u.team, role: u.role, active: true },
      create: u,
    });
  }
  console.log(`Seeded ${seedUsers.length} user(s)`);
}

main().finally(() => prisma.$disconnect());

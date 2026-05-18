// Throwaway: list tenants with their stored region fields, newest first.
//   npx tsx scripts/i18n-show-tenants.ts
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?\s*$/);
      if (m) process.env.DATABASE_URL = m[1];
    }
  } catch {}
}

const prisma = new PrismaClient();

prisma.tenant
  .findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { slug: true, name: true, defaultLocale: true, timezone: true, currency: true, createdAt: true },
  })
  .then((rows) => console.table(rows))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

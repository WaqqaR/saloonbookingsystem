// Throwaway helper to flip a tenant's region for live i18n testing.
//   npx tsx scripts/i18n-set-tenant.ts [locale] [timezone] [currency] [slug]
//   npx tsx scripts/i18n-set-tenant.ts                 -> fr-FR Europe/Paris EUR demo
//   npx tsx scripts/i18n-set-tenant.ts en-GB Europe/London GBP demo   (reset)
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

// Standalone scripts don't get Next's env loading; pull DATABASE_URL from .env.
if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\n]+)"?\s*$/);
      if (m) process.env.DATABASE_URL = m[1];
    }
  } catch {}
}

const [locale = "fr-FR", timezone = "Europe/Paris", currency = "EUR", slug = "demo"] =
  process.argv.slice(2);

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.tenant.findUnique({
    where: { slug },
    select: { slug: true, defaultLocale: true, timezone: true, currency: true },
  });
  if (!before) {
    console.error(`No tenant with slug "${slug}". Run \`npm run db:seed\` first.`);
    process.exit(1);
  }
  console.log("before:", before);
  const after = await prisma.tenant.update({
    where: { slug },
    data: { defaultLocale: locale, timezone, currency },
    select: { slug: true, defaultLocale: true, timezone: true, currency: true },
  });
  console.log("after :", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

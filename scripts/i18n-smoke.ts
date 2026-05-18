// Throwaway i18n smoke check — run with: npx tsx scripts/i18n-smoke.ts
// Exercises the formatting helpers exactly as the booking pages call them.
import { formatInTenantTz } from "../lib/datetime";
import { formatPrice } from "../lib/utils";

const when = new Date("2026-05-18T13:30:00Z"); // fixed instant for deterministic output
const priceCents = 123456;

const tenants = [
  { defaultLocale: "en-GB", timezone: "Europe/London",     currency: "GBP" },
  { defaultLocale: "fr-FR", timezone: "Europe/Paris",      currency: "EUR" },
  { defaultLocale: "de-DE", timezone: "Europe/Berlin",     currency: "EUR" },
  { defaultLocale: "en-US", timezone: "America/New_York",  currency: "USD" },
  { defaultLocale: "sv-SE", timezone: "Europe/Stockholm",  currency: "SEK" },
  { defaultLocale: "ar-AE", timezone: "Asia/Dubai",        currency: "AED" },
];

for (const t of tenants) {
  console.log(`\n${t.defaultLocale}  ${t.timezone}  ${t.currency}`);
  console.log(`  date (full) : ${formatInTenantTz(when, t, "full")}`);
  console.log(`  date (short): ${formatInTenantTz(when, t, "short")}`);
  console.log(`  price       : ${formatPrice(priceCents, t.currency)}`);
}

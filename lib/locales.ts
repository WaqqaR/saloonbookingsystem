// Curated option lists for the signup "Region" picker. Detected values from the
// browser are always usable even if not in these lists (the UI injects them).

export const LOCALES: { value: string; label: string }[] = [
  { value: "en-GB", label: "English (UK)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-IE", label: "English (Ireland)" },
  { value: "en-AU", label: "English (Australia)" },
  { value: "en-CA", label: "English (Canada)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "fr-CA", label: "Français (Canada)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "it-IT", label: "Italiano (Italia)" },
  { value: "nl-NL", label: "Nederlands (Nederland)" },
  { value: "pt-PT", label: "Português (Portugal)" },
  { value: "sv-SE", label: "Svenska (Sverige)" },
  { value: "ar-AE", label: "العربية (الإمارات)" },
];

export const CURRENCIES: { value: string; label: string }[] = [
  { value: "GBP", label: "GBP — British Pound" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "NZD", label: "NZD — New Zealand Dollar" },
  { value: "CHF", label: "CHF — Swiss Franc" },
  { value: "SEK", label: "SEK — Swedish Krona" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "ZAR", label: "ZAR — South African Rand" },
];

export const COMMON_TIMEZONES: string[] = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Lisbon",
  "Europe/Stockholm",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Australia/Sydney",
  "Australia/Perth",
  "Pacific/Auckland",
  "Asia/Dubai",
  "Africa/Johannesburg",
];

// Region (the part after the dash in a BCP-47 tag) → ISO-4217 currency.
const REGION_CURRENCY: Record<string, string> = {
  GB: "GBP", US: "USD", IE: "EUR", FR: "EUR", DE: "EUR", ES: "EUR",
  IT: "EUR", NL: "EUR", PT: "EUR", AU: "AUD", CA: "CAD", NZ: "NZD",
  CH: "CHF", SE: "SEK", AE: "AED", ZA: "ZAR",
};

export function currencyForLocale(locale: string): string {
  const region = locale.split("-")[1]?.toUpperCase();
  return (region && REGION_CURRENCY[region]) || "GBP";
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function regionSummary(locale: string, timezone: string, currency: string): string {
  const localeLabel = LOCALES.find((l) => l.value === locale)?.label || locale;
  return `${localeLabel} · ${timezone} · ${currency}`;
}

// Right-to-left scripts (language subtag of the BCP-47 tag).
const RTL_LANGS = new Set(["ar", "he", "fa", "ur", "ps", "sd", "dv", "yi"]);

export function dirForLocale(locale: string | null | undefined): "rtl" | "ltr" {
  const lang = (locale || "").split("-")[0].toLowerCase();
  return RTL_LANGS.has(lang) ? "rtl" : "ltr";
}

import { getRequestConfig } from "next-intl/server";

const DEFAULT_LOCALE = "en-GB";
const SUPPORTED = new Set(["en-GB"]);

// Locale resolution for customer-facing pages. v1: always returns the default.
// When adding more languages, resolve from the per-tenant `defaultLocale` here
// (read the slug from the request URL, look up the tenant, pick a supported tag).
export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  const messages = (await import(`../messages/${SUPPORTED.has(locale) ? locale : DEFAULT_LOCALE}.json`)).default;
  return { locale, messages };
});

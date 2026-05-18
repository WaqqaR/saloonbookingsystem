import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { prisma } from "../lib/prisma";

const DEFAULT_LOCALE = "en-GB";
// Locales we ship a message catalog for. A tenant set to anything else (e.g.
// nl-NL) still gets localised dates/prices via lib/datetime + formatPrice, but
// falls back to English copy here until its catalog is added.
const SUPPORTED = new Set(["en-GB", "ar-AE", "fr-FR", "es-ES", "de-DE", "it-IT"]);

// slug -> resolved locale, short-lived so we don't hit the DB on every render.
const cache = new Map<string, { locale: string; at: number }>();
const TTL = 60_000;

// Lets a server route drop a tenant's cached locale the moment it changes
// (e.g. owner picks a new language in Settings) instead of waiting out the
// TTL. Per-process: other serverless instances still self-heal within TTL.
export function invalidateLocaleCache(slug: string) {
  cache.delete(slug);
}

function slugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/(?:t|embed)\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

type Dict = Record<string, unknown>;

// Overlay a (possibly partial) locale catalog on the English base so any key
// not yet translated falls back to English instead of throwing MISSING_MESSAGE.
function deepMerge(base: Dict, over: Dict): Dict {
  const out: Dict = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) &&
      b && typeof b === "object" && !Array.isArray(b)
        ? deepMerge(b as Dict, v as Dict)
        : v;
  }
  return out;
}

async function localeForSlug(slug: string): Promise<string> {
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL) return hit.locale;
  let locale = DEFAULT_LOCALE;
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { defaultLocale: true },
    });
    if (tenant?.defaultLocale) locale = tenant.defaultLocale;
  } catch {
    // DB unreachable / no such tenant — keep the default.
  }
  cache.set(slug, { locale, at: Date.now() });
  return locale;
}

export default getRequestConfig(async () => {
  let tenantLocale = DEFAULT_LOCALE;
  try {
    const h = await headers();
    // Subdomain mode sets x-tenant-slug; path mode keeps it in x-pathname.
    const slug = h.get("x-tenant-slug") || slugFromPath(h.get("x-pathname") || "");
    if (slug) tenantLocale = await localeForSlug(slug);
  } catch {
    // Outside a request scope (e.g. build) — fall back to the default.
  }
  const locale = SUPPORTED.has(tenantLocale) ? tenantLocale : DEFAULT_LOCALE;
  const base = (await import(`../messages/${DEFAULT_LOCALE}.json`)).default as Dict;
  let messages: Dict = base;
  if (locale !== DEFAULT_LOCALE) {
    try {
      const overrides = (await import(`../messages/${locale}.json`)).default as Dict;
      // Keep the resolved locale (dates/dir stay correct); any untranslated
      // key transparently falls back to the English string.
      messages = deepMerge(base, overrides);
    } catch {
      // Catalog not shipped yet — English copy until it lands.
    }
  }
  return { locale, messages };
});

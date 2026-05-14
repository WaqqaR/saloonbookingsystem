import { headers } from "next/headers";
import { prisma } from "./prisma";

const RESERVED_HOSTS = new Set(["www", "app", "api", "admin"]);

/** Extracts the tenant subdomain from a host like "acme.lvh.me:3000" or "acme.yoursaas.com". */
export function extractSubdomain(host: string, baseDomain: string): string | null {
  const h = host.split(":")[0].toLowerCase();
  const base = baseDomain.split(":")[0].toLowerCase();
  if (h === base) return null;
  if (!h.endsWith("." + base)) return null;
  const sub = h.slice(0, -("." + base).length);
  if (!sub || sub.includes(".")) return null;
  if (RESERVED_HOSTS.has(sub)) return null;
  return sub;
}

/** Server helper: returns the current tenant by request host, or null. */
export async function getTenantFromHost() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const slug = h.get("x-tenant-slug");
  if (slug) {
    return prisma.tenant.findUnique({ where: { slug } });
  }
  const base = process.env.APP_BASE_DOMAIN || "lvh.me:3000";
  const sub = extractSubdomain(host, base);
  if (!sub) return null;
  return prisma.tenant.findUnique({ where: { slug: sub } });
}

/** Marketing site == apex or "app" subdomain. */
export async function isMarketingHost() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const base = process.env.APP_BASE_DOMAIN || "lvh.me:3000";
  const sub = extractSubdomain(host, base);
  return sub === null || sub === "app";
}

export function tenantUrl(slug: string, path = "/", opts?: { app?: boolean }) {
  const base = process.env.APP_BASE_DOMAIN || "lvh.me:3000";
  const proto = process.env.APP_PROTOCOL || "http";
  if (opts?.app) return `${proto}://${base}${path}`;
  // /api/* routes live at the app root, not under /t/<slug>/.
  if (path.startsWith("/api/")) return `${proto}://${base}${path}`;
  const tenantPath = path === "/" ? "" : path;
  return `${proto}://${base}/t/${slug}${tenantPath}`;
}

export function appUrl(path = "/") {
  const base = process.env.APP_BASE_DOMAIN || "lvh.me:3000";
  const proto = process.env.APP_PROTOCOL || "http";
  return `${proto}://${base}${path}`;
}

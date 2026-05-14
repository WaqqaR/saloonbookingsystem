import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "salon_session";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-change-me-in-production-please-32"
  );
}

export type Session = { userId: string; tenantId: string; tenantSlug: string; role: string; email: string };

export async function createSession(s: Session) {
  const token = await new SignJWT(s as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_PROTOCOL === "https",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    domain: cookieDomain(),
  });
}

function cookieDomain(): string | undefined {
  // Allow the cookie to be shared across all tenant subdomains.
  const host = (process.env.APP_BASE_DOMAIN || "").split(":")[0];
  if (!host || host === "localhost") return undefined;
  return "." + host;
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete({ name: COOKIE, path: "/", domain: cookieDomain() });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    include: { tenant: true },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export function isReservedSlug(slug: string) {
  const reserved = new Set([
    "www", "app", "api", "admin", "auth", "login", "signup", "billing",
    "mail", "ftp", "ns1", "ns2", "blog", "docs", "help", "support",
    "status", "dashboard", "settings", "embed", "widget", "static",
    "assets", "cdn", "media", "files", "stripe", "webhook", "webhooks",
    "demo", "test", "staging", "prod", "production", "dev", "development",
    "marketing", "pricing", "terms", "privacy", "about", "contact",
    "book", "bookings", "appointment", "appointments",
  ]);
  return reserved.has(slug);
}

const SLUG_RE = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

export function isValidSlug(slug: string) {
  return SLUG_RE.test(slug) && !isReservedSlug(slug);
}

export function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

import { SignJWT, jwtVerify } from "jose";
import type { Session } from "./auth";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-change-me-in-production-please-32"
  );
}

/**
 * Short-lived (5min) one-time token used to bounce a session
 * from the apex to a tenant subdomain (or between sibling subdomains)
 * when browsers won't share the cookie.
 */
export async function createHandoffToken(session: Session): Promise<string> {
  return await new SignJWT(session as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .setSubject("handoff")
    .sign(secret());
}

export async function consumeHandoffToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { subject: "handoff" });
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

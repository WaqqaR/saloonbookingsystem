import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyCredentials } from "@/lib/auth";
import { createHandoffToken } from "@/lib/handoff";
import { tenantUrl } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const user = await verifyCredentials(email, password);
  if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const sessionPayload = {
    userId: user.id,
    tenantId: user.tenant.id,
    tenantSlug: user.tenant.slug,
    role: user.role,
    email: user.email,
  };
  await createSession(sessionPayload);
  const handoff = await createHandoffToken(sessionPayload);

  return NextResponse.json({
    redirect: tenantUrl(user.tenant.slug, `/api/session/handoff?t=${handoff}&to=${encodeURIComponent("/admin")}`),
  });
}

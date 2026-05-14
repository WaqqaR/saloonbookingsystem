import { NextRequest, NextResponse } from "next/server";
import { consumeHandoffToken } from "@/lib/handoff";
import { createSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");
  const to = req.nextUrl.searchParams.get("to") || "/admin";

  // Build target URL from the actual Host header so the redirect stays on the
  // tenant subdomain (Next.js req.nextUrl can lose the subdomain in dev).
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";

  if (!token) {
    return NextResponse.redirect(`${proto}://${host}/login`, { status: 302 });
  }

  const session = await consumeHandoffToken(token);
  if (!session) {
    return NextResponse.redirect(`${proto}://${host}/login`, { status: 302 });
  }

  // Set the session cookie on THIS host.
  await createSession(session);

  // Sanitize redirect target: must be a same-origin path.
  const safePath = to.startsWith("/") ? to : "/admin";
  return NextResponse.redirect(`${proto}://${host}${safePath}`, { status: 302 });
}

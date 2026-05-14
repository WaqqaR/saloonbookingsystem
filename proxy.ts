import { NextRequest, NextResponse } from "next/server";
import { extractSubdomain } from "@/lib/tenant";

// Middleware runs on the edge — no Prisma here. We just parse the subdomain
// and pass it to the app via a request header. Tenant lookup happens server-side.
export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const baseDomain = process.env.APP_BASE_DOMAIN || "lvh.me:3000";
  const sub = extractSubdomain(host, baseDomain);

  const requestHeaders = new Headers(req.headers);
  if (sub && sub !== "app") {
    requestHeaders.set("x-tenant-slug", sub);
  }
  requestHeaders.set("x-host", host);

  // Rewrite tenant subdomains:
  //  - acme.lvh.me/        -> /t/acme/
  //  - acme.lvh.me/admin   -> /t/acme/admin
  //  Apex and app.* are served as-is (marketing + signin live there).
  const url = req.nextUrl.clone();
  if (sub && sub !== "app") {
    if (!url.pathname.startsWith("/t/") && !url.pathname.startsWith("/api/") &&
        !url.pathname.startsWith("/_next") && url.pathname !== "/widget.js" &&
        !url.pathname.startsWith("/embed/")) {
      url.pathname = `/t/${sub}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

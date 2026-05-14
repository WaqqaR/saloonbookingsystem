import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isReservedSlug, isValidSlug } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") || "").toLowerCase();
  if (!slug) return NextResponse.json({ ok: false, reason: "invalid" });
  if (!isValidSlug(slug)) {
    return NextResponse.json({ ok: false, reason: isReservedSlug(slug) ? "reserved" : "invalid" });
  }
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ ok: false, reason: "taken" });
  return NextResponse.json({ ok: true });
}

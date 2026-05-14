import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { hours } = await req.json();
  for (const h of hours) {
    await prisma.businessHours.upsert({
      where: { tenantId_dayOfWeek: { tenantId: session.tenantId, dayOfWeek: h.dayOfWeek } },
      update: { open: h.open, openTime: h.openTime, closeTime: h.closeTime },
      create: { tenantId: session.tenantId, dayOfWeek: h.dayOfWeek, open: h.open, openTime: h.openTime, closeTime: h.closeTime },
    });
  }
  return NextResponse.json({ ok: true });
}

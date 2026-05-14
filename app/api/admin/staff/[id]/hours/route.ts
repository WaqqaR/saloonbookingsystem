import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await prisma.staff.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { hours } = await req.json();
  for (const h of hours) {
    await prisma.staffHours.upsert({
      where: { staffId_dayOfWeek: { staffId: id, dayOfWeek: h.dayOfWeek } },
      update: { open: h.open, openTime: h.openTime, closeTime: h.closeTime },
      create: { staffId: id, dayOfWeek: h.dayOfWeek, open: h.open, openTime: h.openTime, closeTime: h.closeTime },
    });
  }
  return NextResponse.json({ ok: true });
}

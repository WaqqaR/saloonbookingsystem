import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncSeats } from "@/lib/billing";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();

  const staff = await prisma.staff.create({
    data: {
      tenantId: session.tenantId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      bio: data.bio || null,
      color: data.color || null,
      active: data.active ?? true,
    },
    include: { workingHours: true },
  });

  // Default to shop hours.
  const shopHours = await prisma.businessHours.findMany({ where: { tenantId: session.tenantId } });
  for (const h of shopHours) {
    await prisma.staffHours.create({
      data: { staffId: staff.id, dayOfWeek: h.dayOfWeek, open: h.open, openTime: h.openTime, closeTime: h.closeTime },
    });
  }

  await syncSeats(session.tenantId);
  const fresh = await prisma.staff.findUnique({ where: { id: staff.id }, include: { workingHours: true } });
  return NextResponse.json({ staff: fresh });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { syncSeats } from "@/lib/billing";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await prisma.staff.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = await req.json();
  const wasActive = owned.active;
  const staff = await prisma.staff.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      bio: data.bio || null,
      color: data.color || null,
      active: data.active,
    },
    include: { workingHours: true },
  });
  if (wasActive !== staff.active) await syncSeats(session.tenantId);
  return NextResponse.json({ staff });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await prisma.staff.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bookings = await prisma.booking.count({ where: { staffId: id } });
  if (bookings > 0) {
    await prisma.staff.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.staff.delete({ where: { id } });
  }
  await syncSeats(session.tenantId);
  return NextResponse.json({ ok: true });
}

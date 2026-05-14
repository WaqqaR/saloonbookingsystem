import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();
  const owned = await prisma.service.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const service = await prisma.service.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      durationMinutes: Number(data.durationMinutes),
      priceCents: Number(data.priceCents),
      category: data.category,
      active: data.active,
      paymentMode: data.paymentMode,
      depositCents: data.depositCents != null ? Number(data.depositCents) : undefined,
    },
  });
  return NextResponse.json({ service });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await prisma.service.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bookings = await prisma.booking.count({ where: { serviceId: id } });
  if (bookings > 0) {
    await prisma.service.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true, softDeleted: true });
  }
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

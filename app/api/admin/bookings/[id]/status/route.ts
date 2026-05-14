import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const ALLOWED = ["confirmed", "completed", "no_show", "cancelled"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json();
  if (!ALLOWED.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const owned = await prisma.booking.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const booking = await prisma.booking.update({ where: { id }, data: { status } });
  return NextResponse.json({ booking });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await prisma.customer.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { notes } = await req.json();
  const customer = await prisma.customer.update({ where: { id }, data: { notes } });
  return NextResponse.json({ customer });
}

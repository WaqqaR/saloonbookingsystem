import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await prisma.product.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = await req.json();
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      priceCents: Number(data.priceCents),
      stock: Number(data.stock),
      category: data.category,
      imageUrl: data.imageUrl,
      active: data.active,
    },
  });
  return NextResponse.json({ product });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await prisma.product.findFirst({ where: { id, tenantId: session.tenantId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const product = await prisma.product.create({
    data: {
      tenantId: session.tenantId,
      name: data.name,
      description: data.description,
      priceCents: Number(data.priceCents),
      stock: Number(data.stock ?? 0),
      category: data.category,
      imageUrl: data.imageUrl,
      active: data.active ?? true,
    },
  });
  return NextResponse.json({ product });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const service = await prisma.service.create({
    data: {
      tenantId: session.tenantId,
      name: data.name,
      description: data.description,
      durationMinutes: Number(data.durationMinutes),
      priceCents: Number(data.priceCents),
      category: data.category,
      active: data.active ?? true,
      sortOrder: Number(data.sortOrder ?? 0),
      paymentMode: data.paymentMode || "none",
      depositCents: Number(data.depositCents ?? 0),
    },
  });
  return NextResponse.json({ service });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      services: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true, name: true, description: true, durationMinutes: true,
          priceCents: true, category: true, paymentMode: true, depositCents: true,
        },
      },
    },
  });
  if (!tenant) return NextResponse.json({ services: [] }, { headers: cors() });
  return NextResponse.json({
    services: tenant.services,
    policy: {
      cancellationWindowHours: tenant.cancellationWindowHours,
      noShowFeePercent: tenant.noShowFeePercent,
    },
  }, { headers: cors() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

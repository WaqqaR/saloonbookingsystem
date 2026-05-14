import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const staff = await prisma.staff.findMany({
    where: { tenant: { slug }, active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, bio: true, color: true },
  });
  return NextResponse.json({ staff }, { headers: cors() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

function cors() {
  return { "Access-Control-Allow-Origin": "*" };
}

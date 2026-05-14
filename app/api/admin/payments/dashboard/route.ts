import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getExpressDashboardLink } from "@/lib/connect";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant?.stripeConnectAccountId) return NextResponse.json({ error: "Not connected" }, { status: 400 });
  try {
    const url = await getExpressDashboardLink(tenant.stripeConnectAccountId);
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

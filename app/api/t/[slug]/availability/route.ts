import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sp = req.nextUrl.searchParams;
  const serviceId = sp.get("serviceId");
  const date = sp.get("date");
  const staffId = sp.get("staffId");
  if (!serviceId || !date) {
    return NextResponse.json({ error: "serviceId and date are required" }, { status: 400, headers: cors() });
  }
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: cors() });

  const slots = await getAvailableSlots({ tenantId: tenant.id, serviceId, dateISO: date, staffId });
  return NextResponse.json({
    slots: slots.map((s) => ({ start: s.iso, label: formatTime(s.start, tenant.timezone), staffId: s.staffId })),
  }, { headers: cors() });
}

function formatTime(d: Date, tz: string) {
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", timeZone: tz, hour12: false });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

function cors() {
  return { "Access-Control-Allow-Origin": "*" };
}

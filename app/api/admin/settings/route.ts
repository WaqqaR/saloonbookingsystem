import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isBusinessType } from "@/lib/treatments";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const tenant = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      timezone: data.timezone || "Europe/London",
      currency: (data.currency || "GBP").toUpperCase(),
      businessType: isBusinessType(data.businessType) ? data.businessType : null,
      cancellationWindowHours: Math.max(0, Math.min(168, Number(data.cancellationWindowHours ?? 24))),
      noShowFeePercent: Math.max(0, Math.min(100, Number(data.noShowFeePercent ?? 100))),
      emailRemindersEnabled: Boolean(data.emailRemindersEnabled),
      smsRemindersEnabled: Boolean(data.smsRemindersEnabled),
      reminderHoursBefore: Math.max(1, Math.min(168, Number(data.reminderHoursBefore ?? 24))),
    },
  });
  return NextResponse.json({ tenant });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendBookingReminder } from "@/lib/email";
import { sendBookingReminderSms } from "@/lib/sms";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { channels } = await req.json().catch(() => ({ channels: ["email", "sms"] }));

  const booking = await prisma.booking.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { service: true, staff: true, tenant: { select: { name: true, slug: true, currency: true, email: true, timezone: true, defaultLocale: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results: Record<string, any> = {};

  if (channels.includes("email")) {
    try {
      await sendBookingReminder(booking);
      await prisma.booking.update({ where: { id }, data: { reminderSent: true } });
      results.email = "sent";
    } catch (e: any) { results.email = `failed: ${e.message}`; }
  }
  if (channels.includes("sms")) {
    try {
      const r = await sendBookingReminderSms({ ...booking, tenant: { name: booking.tenant.name, slug: booking.tenant.slug, timezone: booking.tenant.timezone, defaultLocale: booking.tenant.defaultLocale } });
      if (r.sent || r.stubbed) {
        await prisma.booking.update({ where: { id }, data: { smsReminderSent: true } });
      }
      results.sms = r.sent ? "sent" : r.disabled ? "disabled" : r.stubbed ? "stubbed (no Twilio key)" : `failed: ${r.error}`;
    } catch (e: any) { results.sms = `failed: ${e.message}`; }
  }

  return NextResponse.json({ ok: true, results });
}

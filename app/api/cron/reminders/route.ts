import { NextRequest, NextResponse } from "next/server";
import { addHours, addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendBookingReminder } from "@/lib/email";
import { sendBookingReminderSms } from "@/lib/sms";

// Hourly cron: send email and/or SMS reminders + expire stale pending bookings.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Each tenant has its own reminderHoursBefore. We look up all confirmed bookings
  // whose start is within (reminderHoursBefore ± 30min) for each tenant.
  const tenants = await prisma.tenant.findMany({
    where: { OR: [{ emailRemindersEnabled: true }, { smsRemindersEnabled: true }] },
    select: { id: true, reminderHoursBefore: true, emailRemindersEnabled: true, smsRemindersEnabled: true },
  });

  let emailsSent = 0, smsSent = 0;

  for (const t of tenants) {
    const from = addMinutes(addHours(new Date(), t.reminderHoursBefore), -30);
    const to   = addMinutes(addHours(new Date(), t.reminderHoursBefore), 30);

    const candidates = await prisma.booking.findMany({
      where: {
        tenantId: t.id,
        status: "confirmed",
        startTime: { gte: from, lte: to },
        OR: [
          { reminderSent: false },
          { smsReminderSent: false },
        ],
      },
      include: { service: true, staff: true, tenant: { select: { name: true, currency: true, email: true } } },
    });

    for (const b of candidates) {
      if (t.emailRemindersEnabled && !b.reminderSent) {
        try {
          await sendBookingReminder(b);
          await prisma.booking.update({ where: { id: b.id }, data: { reminderSent: true } });
          emailsSent++;
        } catch (e) { console.error("Email reminder failed", b.id, e); }
      }
      if (t.smsRemindersEnabled && !b.smsReminderSent) {
        try {
          const r = await sendBookingReminderSms({ ...b, tenant: { name: b.tenant.name } });
          if (r.sent || r.stubbed) {
            await prisma.booking.update({ where: { id: b.id }, data: { smsReminderSent: true } });
            if (r.sent) smsSent++;
          }
        } catch (e) { console.error("SMS reminder failed", b.id, e); }
      }
    }
  }

  // Expire stale pending bookings (failed/abandoned payments).
  const expired = await prisma.booking.updateMany({
    where: { status: "pending", expiresAt: { lt: new Date() } },
    data: { status: "cancelled", paymentStatus: "failed" },
  });

  return NextResponse.json({ ok: true, emailsSent, smsSent, expired: expired.count });
}

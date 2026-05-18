import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isBusinessType } from "@/lib/treatments";
import { invalidateLocaleCache } from "@/i18n/request";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  // Only accept a well-formed BCP-47 tag (e.g. en-GB); otherwise leave the
  // tenant's existing locale untouched rather than clobbering it with a default.
  const localeValid =
    typeof data.locale === "string" && /^[a-z]{2}-[A-Z]{2}$/.test(data.locale);
  const tenant = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      ...(localeValid ? { defaultLocale: data.locale } : {}),
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
  // Drop the cached slug→locale entry so the new language takes effect on the
  // next render instead of after the 60s TTL.
  if (localeValid) invalidateLocaleCache(tenant.slug);
  return NextResponse.json({ tenant });
}

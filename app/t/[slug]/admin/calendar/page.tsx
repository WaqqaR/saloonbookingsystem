import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { startOfDay, endOfDay, addDays, startOfWeek, format } from "date-fns";
import { CalendarView } from "./CalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; view?: "day" | "week" }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { tenant } = await requireTenantAdmin(slug);

  const view = sp.view === "week" ? "week" : "day";
  const baseDate = sp.date ? new Date(sp.date) : new Date();
  const rangeStart = view === "week" ? startOfWeek(baseDate, { weekStartsOn: 1 }) : startOfDay(baseDate);
  const rangeEnd = view === "week" ? endOfDay(addDays(rangeStart, 6)) : endOfDay(baseDate);

  const [bookings, staff, hours, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        startTime: { gte: rangeStart, lte: rangeEnd },
        OR: [
          { status: "confirmed" },
          { status: "pending", expiresAt: { gt: new Date() } },
          { status: "completed" },
        ],
      },
      include: { service: true, staff: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.staff.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.businessHours.findMany({ where: { tenantId: tenant.id } }),
    prisma.blockedTime.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { startTime: { gte: rangeStart, lte: rangeEnd } },
          { endTime: { gte: rangeStart, lte: rangeEnd } },
        ],
      },
    }),
  ]);

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="font-display text-3xl font-medium mb-6">Diary</h1>
      <CalendarView
        view={view}
        baseDateISO={format(baseDate, "yyyy-MM-dd")}
        staff={staff.map((s) => ({ id: s.id, name: s.name, color: s.color || "#888" }))}
        hours={hours.map((h) => ({ dayOfWeek: h.dayOfWeek, open: h.open, openTime: h.openTime, closeTime: h.closeTime }))}
        bookings={bookings.map((b) => ({
          id: b.id,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          serviceName: b.service.name,
          staffId: b.staffId,
          staffName: b.staff?.name || null,
          staffColor: b.staff?.color || null,
          status: b.status,
          paymentStatus: b.paymentStatus,
          priceCents: b.priceCents,
        }))}
        blocks={blocks.map((b) => ({
          id: b.id,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
          staffId: b.staffId,
          reason: b.reason,
        }))}
        currency={tenant.currency}
      />
    </div>
  );
}

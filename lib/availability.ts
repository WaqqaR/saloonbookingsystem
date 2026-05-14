import { prisma } from "./prisma";
import { addMinutes, startOfDay, endOfDay, isBefore } from "date-fns";
import { toMinutes } from "./utils";

const SLOT_GRANULARITY = 15;

export type Slot = { start: Date; end: Date; iso: string; staffId: string | null };

export async function getAvailableSlots(args: {
  tenantId: string;
  serviceId: string;
  dateISO: string;
  staffId?: string | null; // null/undefined = any staff member
}): Promise<Slot[]> {
  const { tenantId, serviceId, dateISO, staffId } = args;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId, active: true },
  });
  if (!service) return [];

  const day = new Date(dateISO + "T00:00:00");
  const dow = day.getDay();
  const duration = service.durationMinutes;

  // Find candidate staff (either the specifically chosen one, or all active staff).
  const staffWhere: any = { tenantId, active: true };
  if (staffId) staffWhere.id = staffId;
  const candidates = await prisma.staff.findMany({
    where: staffWhere,
    include: {
      workingHours: { where: { dayOfWeek: dow } },
    },
  });

  // If shop has no staff yet, fall back to shop business hours (single-chair mode).
  let staffWithHours: { id: string | null; openMin: number; closeMin: number }[] = [];
  if (candidates.length === 0) {
    const sh = await prisma.businessHours.findFirst({ where: { tenantId, dayOfWeek: dow } });
    if (!sh || !sh.open) return [];
    staffWithHours = [{ id: null, openMin: toMinutes(sh.openTime), closeMin: toMinutes(sh.closeTime) }];
  } else {
    for (const s of candidates) {
      const h = s.workingHours[0];
      if (!h || !h.open) continue;
      staffWithHours.push({ id: s.id, openMin: toMinutes(h.openTime), closeMin: toMinutes(h.closeTime) });
    }
  }
  if (staffWithHours.length === 0) return [];

  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tenantId,
        startTime: { gte: dayStart, lte: dayEnd },
        ...(staffId ? { staffId } : {}),
        OR: [
          { status: "confirmed" },
          // Pending bookings hold the slot only until their expiry.
          { status: "pending", expiresAt: { gt: new Date() } },
        ],
      },
      select: { startTime: true, endTime: true, staffId: true },
    }),
    prisma.blockedTime.findMany({
      where: {
        tenantId,
        OR: [
          { startTime: { gte: dayStart, lte: dayEnd } },
          { endTime: { gte: dayStart, lte: dayEnd } },
        ],
      },
      select: { startTime: true, endTime: true, staffId: true },
    }),
  ]);

  const now = Date.now();
  const slots: Slot[] = [];
  const seenISO = new Set<string>();

  // For "any staff" mode: a slot is offered if at least one staff is free.
  for (const sh of staffWithHours) {
    for (let m = sh.openMin; m + duration <= sh.closeMin; m += SLOT_GRANULARITY) {
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      start.setMinutes(m);
      const end = addMinutes(start, duration);

      if (isBefore(start, new Date(now))) continue;

      const startMs = start.getTime();
      const endMs = end.getTime();

      const conflict =
        bookings.some((b) =>
          (b.staffId === sh.id || (sh.id === null && b.staffId === null)) &&
          startMs < new Date(b.endTime).getTime() &&
          endMs > new Date(b.startTime).getTime()
        ) ||
        blocks.some((b) =>
          (b.staffId === sh.id || b.staffId === null) &&
          startMs < new Date(b.endTime).getTime() &&
          endMs > new Date(b.startTime).getTime()
        );
      if (conflict) continue;

      if (!staffId && seenISO.has(start.toISOString())) continue;
      seenISO.add(start.toISOString());
      slots.push({ start, end, iso: start.toISOString(), staffId: sh.id });
    }
  }

  slots.sort((a, b) => a.iso.localeCompare(b.iso));
  return slots;
}

export async function isSlotAvailable(args: {
  tenantId: string;
  serviceId: string;
  startISO: string;
  staffId?: string | null;
}) {
  const dateISO = new Date(args.startISO).toISOString().split("T")[0];
  const slots = await getAvailableSlots({ ...args, dateISO });
  return slots.some((s) =>
    s.iso === new Date(args.startISO).toISOString() &&
    (!args.staffId || s.staffId === args.staffId)
  );
}

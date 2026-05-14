"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDays, addWeeks, format, isSameDay, parseISO, startOfDay, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

type Staff = { id: string; name: string; color: string };
type Hours = { dayOfWeek: number; open: boolean; openTime: string; closeTime: string };
type Booking = {
  id: string;
  startTime: string; endTime: string;
  customerName: string; customerPhone: string;
  serviceName: string;
  staffId: string | null; staffName: string | null; staffColor: string | null;
  status: string; paymentStatus: string;
  priceCents: number;
};
type Block = { id: string; startTime: string; endTime: string; staffId: string | null; reason: string | null };

const PIXEL_PER_MIN = 1.5;          // 1.5px per minute -> ~90px per hour
const SLOT_INTERVAL = 30;            // 30-min hour markers
const HOUR_LABEL_WIDTH = 56;

export function CalendarView({
  view, baseDateISO, staff, hours, bookings, blocks, currency,
}: {
  view: "day" | "week";
  baseDateISO: string;
  staff: Staff[];
  hours: Hours[];
  bookings: Booking[];
  blocks: Block[];
  currency: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const baseDate = useMemo(() => parseISO(baseDateISO + "T12:00:00"), [baseDateISO]);
  const [selected, setSelected] = useState<Booking | null>(null);

  function navigate(direction: -1 | 0 | 1) {
    const next = direction === 0 ? new Date() : view === "day" ? addDays(baseDate, direction) : addWeeks(baseDate, direction);
    const q = new URLSearchParams(params.toString());
    q.set("date", format(next, "yyyy-MM-dd"));
    q.set("view", view);
    router.push(`?${q.toString()}`);
  }
  function setView(v: "day" | "week") {
    const q = new URLSearchParams(params.toString());
    q.set("view", v);
    q.set("date", format(baseDate, "yyyy-MM-dd"));
    router.push(`?${q.toString()}`);
  }

  // Build the time axis bounded by earliest open and latest close across the week.
  const { rangeStartMin, rangeEndMin } = useMemo(() => {
    let earliest = 9 * 60, latest = 18 * 60;
    for (const h of hours) {
      if (!h.open) continue;
      const [oh, om] = h.openTime.split(":").map(Number);
      const [ch, cm] = h.closeTime.split(":").map(Number);
      earliest = Math.min(earliest, oh * 60 + om);
      latest = Math.max(latest, ch * 60 + cm);
    }
    return { rangeStartMin: earliest, rangeEndMin: latest };
  }, [hours]);

  const totalMin = rangeEndMin - rangeStartMin;
  const gridHeight = totalMin * PIXEL_PER_MIN;

  const days = view === "day"
    ? [baseDate]
    : Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek(baseDate, { weekStartsOn: 1 }), i));

  const hourMarks = useMemo(() => {
    const marks: { min: number; label: string }[] = [];
    const firstHour = Math.ceil(rangeStartMin / SLOT_INTERVAL) * SLOT_INTERVAL;
    for (let m = firstHour; m <= rangeEndMin; m += SLOT_INTERVAL) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      const isHour = mm === 0;
      marks.push({
        min: m,
        label: isHour ? `${h.toString().padStart(2, "0")}:00` : `${h.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`,
      });
    }
    return marks;
  }, [rangeStartMin, rangeEndMin]);

  // Compute booking placement.
  function bookingStyle(b: { startTime: string; endTime: string }) {
    const start = parseISO(b.startTime);
    const end = parseISO(b.endTime);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    return {
      top: (startMin - rangeStartMin) * PIXEL_PER_MIN,
      height: Math.max(20, (endMin - startMin) * PIXEL_PER_MIN),
    };
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => navigate(0)}>Today</Button>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
        <div className="font-display text-xl ml-2">
          {view === "day"
            ? format(baseDate, "EEEE, MMMM d, yyyy")
            : `${format(startOfWeek(baseDate, { weekStartsOn: 1 }), "MMM d")} – ${format(addDays(startOfWeek(baseDate, { weekStartsOn: 1 }), 6), "MMM d, yyyy")}`}
        </div>
        <div className="ml-auto flex gap-1 border border-border rounded-md p-0.5">
          <Button variant={view === "day" ? "default" : "ghost"} size="sm" onClick={() => setView("day")}>Day</Button>
          <Button variant={view === "week" ? "default" : "ghost"} size="sm" onClick={() => setView("week")}>Week</Button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-card border border-border/60 rounded-md overflow-hidden">
        {view === "day" ? (
          <DayGrid
            day={baseDate}
            staff={staff}
            bookings={bookings}
            blocks={blocks}
            rangeStartMin={rangeStartMin}
            gridHeight={gridHeight}
            hourMarks={hourMarks}
            bookingStyle={bookingStyle}
            onSelect={setSelected}
          />
        ) : (
          <WeekGrid
            days={days}
            staff={staff}
            bookings={bookings}
            rangeStartMin={rangeStartMin}
            gridHeight={gridHeight}
            hourMarks={hourMarks}
            bookingStyle={bookingStyle}
            onSelect={setSelected}
          />
        )}
      </div>

      {/* Booking detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{selected.customerName}</DialogTitle>
                <DialogDescription>{selected.serviceName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" /> {format(parseISO(selected.startTime), "EEE, MMM d 'at' h:mm a")}</div>
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {Math.round((parseISO(selected.endTime).getTime() - parseISO(selected.startTime).getTime()) / 60000)} min
                </div>
                {selected.staffName && (
                  <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" /> {selected.staffName}</div>
                )}
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> {selected.customerPhone}</div>
                <div className="pt-2 flex items-center gap-2">
                  <Badge variant={selected.status === "confirmed" ? "success" : "secondary"}>{selected.status}</Badge>
                  <Badge variant={
                    selected.paymentStatus === "paid" ? "success" :
                    selected.paymentStatus === "refunded" ? "outline" :
                    selected.paymentStatus === "pending" ? "secondary" :
                    "outline"
                  }>{selected.paymentStatus === "none" ? "no payment" : selected.paymentStatus}</Badge>
                  <span className="ml-auto font-display text-lg">{formatPrice(selected.priceCents, currency)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function DayGrid({
  day, staff, bookings, blocks, rangeStartMin, gridHeight, hourMarks, bookingStyle, onSelect,
}: any) {
  const dayBookings: Booking[] = bookings.filter((b: Booking) => isSameDay(parseISO(b.startTime), day));
  const dayBlocks: Block[] = blocks.filter((b: Block) => isSameDay(parseISO(b.startTime), day));
  const cols: Staff[] = staff.length > 0 ? staff : [{ id: "_", name: "Unassigned", color: "#888" }];

  return (
    <div className="flex" style={{ minHeight: gridHeight + 40 }}>
      <TimeAxis hourMarks={hourMarks} rangeStartMin={rangeStartMin} gridHeight={gridHeight} />
      <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(180px, 1fr))` }}>
        {cols.map((s: Staff) => {
          const colBookings = dayBookings.filter((b) => (b.staffId || "_") === s.id);
          const colBlocks = dayBlocks.filter((b) => b.staffId === s.id || b.staffId === null);
          return (
            <StaffColumn
              key={s.id}
              staff={s}
              bookings={colBookings}
              blocks={colBlocks}
              hourMarks={hourMarks}
              rangeStartMin={rangeStartMin}
              gridHeight={gridHeight}
              bookingStyle={bookingStyle}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  days, staff, bookings, rangeStartMin, gridHeight, hourMarks, bookingStyle, onSelect,
}: any) {
  return (
    <div className="flex" style={{ minHeight: gridHeight + 40 }}>
      <TimeAxis hourMarks={hourMarks} rangeStartMin={rangeStartMin} gridHeight={gridHeight} />
      <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(7, minmax(140px, 1fr))` }}>
        {days.map((d: Date) => {
          const dayBookings: Booking[] = bookings.filter((b: Booking) => isSameDay(parseISO(b.startTime), d));
          return (
            <div key={d.toISOString()} className="border-r border-border/40 relative last:border-r-0">
              <div className="h-10 border-b border-border/60 px-2 flex flex-col items-center justify-center text-xs">
                <div className="uppercase tracking-wider text-muted-foreground">{format(d, "EEE")}</div>
                <div className={cn("font-display text-base", isSameDay(d, new Date()) && "text-accent font-medium")}>{format(d, "d")}</div>
              </div>
              <div className="relative" style={{ height: gridHeight }}>
                <HourGridlines hourMarks={hourMarks} rangeStartMin={rangeStartMin} />
                {dayBookings.map((b) => {
                  const { top, height } = bookingStyle(b);
                  const color = b.staffColor || "#888";
                  return (
                    <button
                      key={b.id}
                      onClick={() => onSelect(b)}
                      className="absolute inset-x-1 rounded text-[11px] p-1 text-left overflow-hidden hover:shadow-md transition"
                      style={{ top, height, background: color + "22", borderLeft: `3px solid ${color}` }}
                      title={`${b.customerName} — ${b.serviceName}`}
                    >
                      <div className="font-medium truncate">{format(parseISO(b.startTime), "HH:mm")} {b.customerName}</div>
                      <div className="truncate opacity-80">{b.serviceName}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeAxis({ hourMarks, rangeStartMin, gridHeight }: any) {
  return (
    <div className="w-14 border-r border-border/60 bg-secondary/20 shrink-0">
      <div className="h-10 border-b border-border/60" />
      <div className="relative" style={{ height: gridHeight }}>
        {hourMarks.map((m: any) => (
          <div
            key={m.min}
            className="absolute -translate-y-1/2 text-[10px] text-muted-foreground pl-2"
            style={{ top: (m.min - rangeStartMin) * PIXEL_PER_MIN }}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function HourGridlines({ hourMarks, rangeStartMin }: any) {
  return (
    <>
      {hourMarks.map((m: any) => {
        const isHour = m.label.endsWith(":00");
        return (
          <div
            key={m.min}
            className={cn("absolute left-0 right-0 border-t pointer-events-none", isHour ? "border-border/50" : "border-border/20")}
            style={{ top: (m.min - rangeStartMin) * PIXEL_PER_MIN }}
          />
        );
      })}
    </>
  );
}

function StaffColumn({ staff, bookings, blocks, hourMarks, rangeStartMin, gridHeight, bookingStyle, onSelect }: any) {
  return (
    <div className="border-r border-border/40 relative last:border-r-0">
      <div className="h-10 border-b border-border/60 px-3 flex items-center gap-2 text-sm bg-secondary/10">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: staff.color }} />
        <span className="font-medium truncate">{staff.name}</span>
      </div>
      <div className="relative" style={{ height: gridHeight }}>
        <HourGridlines hourMarks={hourMarks} rangeStartMin={rangeStartMin} />
        {/* Blocked times */}
        {blocks.map((b: Block) => {
          const { top, height } = bookingStyle(b);
          return (
            <div
              key={b.id}
              className="absolute inset-x-1 rounded bg-muted/60 border border-dashed border-muted-foreground/40 text-[11px] p-1 text-muted-foreground overflow-hidden pointer-events-none"
              style={{ top, height }}
            >
              {b.reason || "Blocked"}
            </div>
          );
        })}
        {/* Bookings */}
        {bookings.map((b: Booking) => {
          const { top, height } = bookingStyle(b);
          const color = b.staffColor || staff.color || "#888";
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className="absolute inset-x-1 rounded text-xs p-2 text-left overflow-hidden hover:shadow-md transition"
              style={{ top, height, background: color + "22", borderLeft: `3px solid ${color}` }}
            >
              <div className="font-medium truncate">{format(parseISO(b.startTime), "HH:mm")} · {b.customerName}</div>
              <div className="truncate opacity-80">{b.serviceName}</div>
              {b.status === "pending" && <div className="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">pending payment</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

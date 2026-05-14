import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDuration } from "@/lib/utils";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, format } from "date-fns";
import { TrendingUp, Users, Scissors, AlertTriangle, Repeat, BadgePoundSterling } from "lucide-react";

export const dynamic = "force-dynamic";

type Range = "7d" | "30d" | "month" | "all";
const RANGES: { id: Range; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: Range }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { tenant } = await requireTenantAdmin(slug);
  const range: Range = (sp.range as Range) || "30d";

  const now = new Date();
  let from: Date | undefined;
  switch (range) {
    case "7d": from = startOfDay(subDays(now, 7)); break;
    case "30d": from = startOfDay(subDays(now, 30)); break;
    case "month": from = startOfMonth(now); break;
    case "all": from = undefined; break;
  }
  const to = endOfDay(now);
  const where: any = { tenantId: tenant.id };
  if (from) where.startTime = { gte: from, lte: to };

  const completedWhere = { ...where, status: { in: ["confirmed", "completed"] } };

  const [revenueAgg, totalBookings, completedBookings, cancelledCount, noShowCount, customerCount, serviceBreakdown, staffBreakdown, paidAgg, refundedAgg, dailyRows] = await Promise.all([
    prisma.booking.aggregate({ where: completedWhere, _sum: { priceCents: true }, _count: { _all: true } }),
    prisma.booking.count({ where }),
    prisma.booking.count({ where: completedWhere }),
    prisma.booking.count({ where: { ...where, status: "cancelled" } }),
    prisma.booking.count({ where: { ...where, status: "no_show" } }),
    prisma.customer.count({ where: { tenantId: tenant.id, ...(from ? { createdAt: { gte: from } } : {}) } }),
    prisma.booking.groupBy({
      by: ["serviceId"],
      where: completedWhere,
      _count: { _all: true },
      _sum: { priceCents: true },
      orderBy: { _sum: { priceCents: "desc" } },
      take: 6,
    }),
    prisma.booking.groupBy({
      by: ["staffId"],
      where: completedWhere,
      _count: { _all: true },
      _sum: { priceCents: true },
    }),
    prisma.booking.aggregate({ where: { ...where, paymentStatus: "paid" }, _sum: { amountPaidCents: true }, _count: { _all: true } }),
    prisma.booking.aggregate({ where: { ...where, paymentStatus: "refunded" }, _sum: { amountPaidCents: true }, _count: { _all: true } }),
    // Repeat customers (>= 2 bookings in range)
    prisma.booking.groupBy({
      by: ["customerId"],
      where: { ...completedWhere, customerId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  // Fetch service / staff names for the breakdowns
  const services = serviceBreakdown.length > 0
    ? await prisma.service.findMany({ where: { id: { in: serviceBreakdown.map((s) => s.serviceId) } } })
    : [];
  const staffIds = staffBreakdown.map((s) => s.staffId).filter((x): x is string => !!x);
  const staffList = staffIds.length > 0
    ? await prisma.staff.findMany({ where: { id: { in: staffIds } } })
    : [];

  const revenueCents = revenueAgg._sum.priceCents || 0;
  const avgTicket = revenueAgg._count._all > 0 ? Math.round(revenueCents / revenueAgg._count._all) : 0;
  const repeatCount = dailyRows.filter((r) => r._count._all >= 2).length;
  const totalCustomersInRange = dailyRows.length;
  const repeatRate = totalCustomersInRange > 0 ? Math.round((repeatCount / totalCustomersInRange) * 100) : 0;
  const cancellationRate = totalBookings > 0 ? Math.round(((cancelledCount + noShowCount) / totalBookings) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display text-3xl font-medium">Reports</h1>
        <div className="flex gap-1 border border-border rounded-md p-0.5 text-sm">
          {RANGES.map((r) => (
            <Link key={r.id} href={`?range=${r.id}`}
              className={"px-3 py-1.5 rounded transition " + (r.id === range ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Revenue" value={formatPrice(revenueCents, tenant.currency)} icon={<BadgePoundSterling className="w-4 h-4" />} />
        <Stat label="Bookings" value={String(completedBookings)} icon={<Scissors className="w-4 h-4" />} />
        <Stat label="Average ticket" value={formatPrice(avgTicket, tenant.currency)} icon={<TrendingUp className="w-4 h-4" />} />
        <Stat label="New customers" value={String(customerCount)} icon={<Users className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Repeat rate" value={`${repeatRate}%`} sub={`${repeatCount} of ${totalCustomersInRange}`} icon={<Repeat className="w-4 h-4" />} />
        <Stat label="Cancellation rate" value={`${cancellationRate}%`} sub={`${cancelledCount + noShowCount} of ${totalBookings}`} icon={<AlertTriangle className="w-4 h-4" />} />
        <Stat label="Card payments" value={formatPrice(paidAgg._sum.amountPaidCents || 0, tenant.currency)} sub={`${paidAgg._count._all} payments`} icon={<BadgePoundSterling className="w-4 h-4" />} />
        <Stat label="Refunds" value={formatPrice(refundedAgg._sum.amountPaidCents || 0, tenant.currency)} sub={`${refundedAgg._count._all} refunded`} icon={<AlertTriangle className="w-4 h-4" />} />
      </div>

      {/* Top services */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Top services by revenue</CardTitle>
            <CardDescription>Most-booked treatments in this range.</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet in this range.</p>
            ) : (
              <ul className="space-y-3">
                {serviceBreakdown.map((row, i) => {
                  const svc = services.find((s) => s.id === row.serviceId);
                  const rev = row._sum.priceCents || 0;
                  const max = serviceBreakdown[0]._sum.priceCents || 1;
                  return (
                    <li key={row.serviceId}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{i + 1}. {svc?.name || "—"}</span>
                        <span className="font-display">{formatPrice(rev, tenant.currency)}</span>
                      </div>
                      <div className="h-1 bg-muted rounded">
                        <div className="h-1 bg-accent rounded" style={{ width: `${Math.max(2, (rev / max) * 100)}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{row._count._all} bookings</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Staff performance</CardTitle>
            <CardDescription>Revenue and bookings per staff member.</CardDescription>
          </CardHeader>
          <CardContent>
            {staffBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed bookings in this range.</p>
            ) : (
              <ul className="space-y-3">
                {staffBreakdown.sort((a, b) => (b._sum.priceCents || 0) - (a._sum.priceCents || 0)).map((row) => {
                  const s = staffList.find((st) => st.id === row.staffId);
                  const rev = row._sum.priceCents || 0;
                  const max = Math.max(...staffBreakdown.map((r) => r._sum.priceCents || 0), 1);
                  return (
                    <li key={row.staffId || "_"}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: s?.color || "#888" }} />
                          <span className="font-medium">{s?.name || "Unassigned"}</span>
                        </span>
                        <span className="font-display">{formatPrice(rev, tenant.currency)}</span>
                      </div>
                      <div className="h-1 bg-muted rounded">
                        <div className="h-1 bg-accent rounded" style={{ width: `${Math.max(2, (rev / max) * 100)}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{row._count._all} bookings</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
          <span>{label}</span>
          {icon}
        </div>
        <div className="font-display text-3xl font-medium">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

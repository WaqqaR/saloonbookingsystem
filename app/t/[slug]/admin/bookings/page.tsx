import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent } from "@/components/ui/card";
import { BookingsTable } from "./BookingsTable";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Filter = "upcoming" | "all" | "pending" | "past" | "refunded";

const filterIds: Filter[] = ["upcoming", "pending", "past", "refunded", "all"];

export default async function BookingsAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: Filter }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { tenant } = await requireTenantAdmin(slug);
  const t = await getTranslations("admin.bookings");
  const filter: Filter = (sp.filter as Filter) || "upcoming";

  const filterLabels: Record<Filter, string> = {
    upcoming: t("filterUpcoming"),
    pending: t("filterPending"),
    past: t("filterPast"),
    refunded: t("filterRefunded"),
    all: t("filterAll"),
  };

  const now = new Date();
  const where: any = { tenantId: tenant.id };
  switch (filter) {
    case "upcoming":
      where.status = "confirmed";
      where.startTime = { gte: now };
      break;
    case "pending":
      where.status = "pending";
      where.paymentStatus = "pending";
      break;
    case "past":
      where.status = { in: ["confirmed", "completed", "no_show"] };
      where.startTime = { lt: now };
      break;
    case "refunded":
      where.paymentStatus = "refunded";
      break;
    case "all":
    default:
      break;
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startTime: filter === "past" ? "desc" : "asc" },
    include: { service: true, staff: true },
    take: 200,
  });

  // Counts for tab badges
  const counts = await prisma.booking.groupBy({
    by: ["status", "paymentStatus"],
    where: { tenantId: tenant.id },
    _count: { _all: true },
  });
  const countOf = {
    upcoming: 0, pending: 0, past: 0, refunded: 0, all: 0,
  };
  const allBookings = await prisma.booking.findMany({
    where: { tenantId: tenant.id },
    select: { status: true, paymentStatus: true, startTime: true },
  });
  for (const b of allBookings) {
    countOf.all++;
    if (b.paymentStatus === "refunded") countOf.refunded++;
    else if (b.status === "pending" && b.paymentStatus === "pending") countOf.pending++;
    else if (b.status === "confirmed" && b.startTime >= now) countOf.upcoming++;
    else if (["confirmed", "completed", "no_show"].includes(b.status) && b.startTime < now) countOf.past++;
  }

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="font-display text-3xl font-medium mb-6">{t("title")}</h1>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 mb-5 border-b border-border/60">
        {filterIds.map((id) => {
          const active = id === filter;
          return (
            <Link
              key={id}
              href={`?filter=${id}`}
              className={
                "px-4 py-2.5 text-sm transition border-b-2 -mb-px " +
                (active
                  ? "border-accent text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {filterLabels[id]}
              <span className="ms-2 text-xs opacity-60">{countOf[id]}</span>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <BookingsTable
            bookings={bookings as any}
            currency={tenant.currency}
            defaultLocale={tenant.defaultLocale}
            timezone={tenant.timezone}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { formatInTenantTz } from "@/lib/datetime";
import { getTranslations } from "next-intl/server";
import { startOfToday, endOfDay, addDays } from "date-fns";
import { Calendar, DollarSign, Users, UserCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TenantDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const t = await getTranslations("admin.dashboard");

  const todayStart = startOfToday();
  const next7End = endOfDay(addDays(todayStart, 7));
  const where = { tenantId: tenant.id };

  const [todayCount, weekCount, servicesCount, productsCount, staffCount, customersCount, weekBookings, weekRevenue] = await Promise.all([
    prisma.booking.count({ where: { ...where, startTime: { gte: todayStart, lte: endOfDay(todayStart) }, status: "confirmed" } }),
    prisma.booking.count({ where: { ...where, startTime: { gte: todayStart, lte: next7End }, status: "confirmed" } }),
    prisma.service.count({ where: { ...where, active: true } }),
    prisma.product.count({ where: { ...where, active: true } }),
    prisma.staff.count({ where: { ...where, active: true } }),
    prisma.customer.count({ where }),
    prisma.booking.findMany({
      where: { ...where, startTime: { gte: todayStart, lte: next7End }, status: "confirmed" },
      orderBy: { startTime: "asc" },
      include: { service: true, staff: true },
      take: 10,
    }),
    prisma.booking.aggregate({
      where: { ...where, startTime: { gte: todayStart, lte: next7End }, status: "confirmed" },
      _sum: { priceCents: true },
    }),
  ]);

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label={t("statToday")} value={todayCount} icon={<Calendar className="w-4 h-4" />} />
        <Stat label={t("statNext7")} value={weekCount} icon={<Calendar className="w-4 h-4" />} />
        <Stat label={t("statStaff")} value={staffCount} icon={<Users className="w-4 h-4" />} />
        <Stat label={t("statCustomers")} value={customersCount} icon={<UserCircle className="w-4 h-4" />} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-4 h-4" /> {t("projectedRevenue")}</CardTitle>
            <Badge variant="success">{formatPrice(weekRevenue._sum.priceCents || 0, tenant.currency)}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingBookings")}</CardTitle>
          <CardDescription>{t("next7Days")}</CardDescription>
        </CardHeader>
        <CardContent>
          {weekBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noUpcoming")}</p>
          ) : (
            <ul className="divide-y">
              {weekBookings.map((b) => (
                <li key={b.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{b.customerName}</div>
                    <div className="text-muted-foreground">
                      {b.service.name}{b.staff && ` · ${b.staff.name}`} · {formatInTenantTz(b.startTime, tenant, "short")}
                    </div>
                  </div>
                  <Badge variant="outline">{formatPrice(b.priceCents, tenant.currency)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
          <span>{label}</span>
          {icon}
        </div>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

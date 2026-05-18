import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { HoursEditor } from "./HoursEditor";
import { BlockedTimes } from "./BlockedTimes";

export const dynamic = "force-dynamic";

export default async function AvailabilityAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const t = await getTranslations("admin.availability");

  let hours = await prisma.businessHours.findMany({ where: { tenantId: tenant.id }, orderBy: { dayOfWeek: "asc" } });
  if (hours.length === 0) {
    // Backfill defaults if missing.
    const defaults = [0,1,2,3,4,5,6].map((d) => ({ dayOfWeek: d, open: d !== 0, openTime: "09:00", closeTime: "18:00" }));
    for (const h of defaults) {
      await prisma.businessHours.create({ data: { ...h, tenantId: tenant.id } });
    }
    hours = await prisma.businessHours.findMany({ where: { tenantId: tenant.id }, orderBy: { dayOfWeek: "asc" } });
  }
  const blocked = await prisma.blockedTime.findMany({ where: { tenantId: tenant.id }, orderBy: { startTime: "asc" } });

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("shopHoursTitle")}</CardTitle>
          <CardDescription>{t("shopHoursDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <HoursEditor initial={hours} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("blockedTitle")}</CardTitle>
          <CardDescription>{t("blockedDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BlockedTimes initial={blocked} />
        </CardContent>
      </Card>
    </div>
  );
}

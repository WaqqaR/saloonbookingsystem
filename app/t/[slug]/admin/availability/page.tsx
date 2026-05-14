import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HoursEditor } from "./HoursEditor";
import { BlockedTimes } from "./BlockedTimes";

export const dynamic = "force-dynamic";

export default async function AvailabilityAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);

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
      <h1 className="text-2xl font-bold">Hours & Blocks</h1>

      <Card>
        <CardHeader>
          <CardTitle>Shop hours</CardTitle>
          <CardDescription>Default hours for the whole shop. Individual staff can override.</CardDescription>
        </CardHeader>
        <CardContent>
          <HoursEditor initial={hours} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocked times</CardTitle>
          <CardDescription>Vacations, holidays, training, etc.</CardDescription>
        </CardHeader>
        <CardContent>
          <BlockedTimes initial={blocked} />
        </CardContent>
      </Card>
    </div>
  );
}

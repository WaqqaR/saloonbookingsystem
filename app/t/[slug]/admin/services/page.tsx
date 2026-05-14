import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicesManager } from "./ServicesManager";

export const dynamic = "force-dynamic";

export default async function ServicesAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const services = await prisma.service.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Services & Pricing</h1>
      <Card>
        <CardHeader><CardTitle>Manage services</CardTitle></CardHeader>
        <CardContent>
          <ServicesManager initial={services} currency={tenant.currency} />
        </CardContent>
      </Card>
    </div>
  );
}

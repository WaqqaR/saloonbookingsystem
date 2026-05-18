import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { ServicesManager } from "./ServicesManager";

export const dynamic = "force-dynamic";

export default async function ServicesAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const t = await getTranslations("admin.services");
  const services = await prisma.service.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <Card>
        <CardHeader><CardTitle>{t("manageHeading")}</CardTitle></CardHeader>
        <CardContent>
          <ServicesManager initial={services} currency={tenant.currency} businessType={tenant.businessType} />
        </CardContent>
      </Card>
    </div>
  );
}

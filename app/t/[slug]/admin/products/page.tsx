import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { ProductsManager } from "./ProductsManager";

export const dynamic = "force-dynamic";

export default async function ProductsAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const t = await getTranslations("admin.products");
  const products = await prisma.product.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <Card>
        <CardHeader><CardTitle>{t("manageTitle")}</CardTitle></CardHeader>
        <CardContent>
          <ProductsManager initial={products} currency={tenant.currency} />
        </CardContent>
      </Card>
    </div>
  );
}

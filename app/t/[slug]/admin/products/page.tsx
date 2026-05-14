import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsManager } from "./ProductsManager";

export const dynamic = "force-dynamic";

export default async function ProductsAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const products = await prisma.product.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <Card>
        <CardHeader><CardTitle>Manage products</CardTitle></CardHeader>
        <CardContent>
          <ProductsManager initial={products} currency={tenant.currency} />
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const t = await getTranslations("admin.customers");
  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
    take: 500,
  });
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <Card>
        <CardHeader><CardTitle>{t("countTitle", { count: customers.length })}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("emptyState")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-start text-xs uppercase text-muted-foreground border-b bg-stone-50">
                <tr><th className="p-3">{t("colName")}</th><th className="p-3">{t("colContact")}</th><th className="p-3">{t("colBookings")}</th><th></th></tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground">
                      <div>{c.email}</div>
                      <div className="text-xs">{c.phone}</div>
                    </td>
                    <td className="p-3"><Badge variant="secondary">{c._count.bookings}</Badge></td>
                    <td className="p-3 text-end">
                      <Link className="text-sm text-primary underline" href={`/t/${slug}/admin/customers/${c.id}`}>{t("view")}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

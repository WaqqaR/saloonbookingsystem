import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { formatInTenantTz } from "@/lib/datetime";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { CustomerNotes } from "./CustomerNotes";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const t = await getTranslations("admin.customers");
  const c = await getTranslations("admin.common");
  const customer = await prisma.customer.findFirst({
    where: { id, tenantId: tenant.id },
    include: { bookings: { orderBy: { startTime: "desc" }, include: { service: true, staff: true } } },
  });
  if (!customer) notFound();

  const totalSpent = customer.bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((s, b) => s + b.priceCents, 0);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <Link href={`/t/${slug}/admin/customers`}><Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4" /> {t("back")}</Button></Link>
      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
          <CardDescription>{customer.email} · {customer.phone}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm">
          <div><span className="text-muted-foreground">{t("statBookings")}</span> {customer.bookings.length}</div>
          <div><span className="text-muted-foreground">{t("statTotalSpend")}</span> {formatPrice(totalSpent, tenant.currency)}</div>
          <div><span className="text-muted-foreground">{t("statCustomerSince")}</span> {formatInTenantTz(customer.createdAt, tenant, "monthShort")} {customer.createdAt.getFullYear()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("notesTitle")}</CardTitle></CardHeader>
        <CardContent><CustomerNotes id={customer.id} initial={customer.notes || ""} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("historyTitle")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {customer.bookings.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("noBookings")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-start text-xs uppercase text-muted-foreground border-b">
                <tr><th className="p-2">{t("colWhen")}</th><th className="p-2">{t("colService")}</th><th className="p-2">{t("colStaff")}</th><th className="p-2">{t("colStatus")}</th><th className="p-2">{t("colPrice")}</th></tr>
              </thead>
              <tbody className="divide-y">
                {customer.bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="p-2">{formatInTenantTz(b.startTime, tenant, "long")}</td>
                    <td className="p-2">{b.service.name}</td>
                    <td className="p-2">{b.staff?.name || c("none")}</td>
                    <td className="p-2"><Badge variant={b.status === "confirmed" ? "success" : "secondary"}>{t(`status.${b.status}` as "status.confirmed")}</Badge></td>
                    <td className="p-2">{formatPrice(b.priceCents, tenant.currency)}</td>
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

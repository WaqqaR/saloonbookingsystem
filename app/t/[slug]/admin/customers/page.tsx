import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
    take: 500,
  });
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <Card>
        <CardHeader><CardTitle>{customers.length} customer{customers.length === 1 ? "" : "s"}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No customers yet. They&apos;ll show up automatically as bookings come in.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-stone-50">
                <tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Bookings</th><th></th></tr>
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
                    <td className="p-3 text-right">
                      <Link className="text-sm text-primary underline" href={`/t/${slug}/admin/customers/${c.id}`}>View</Link>
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

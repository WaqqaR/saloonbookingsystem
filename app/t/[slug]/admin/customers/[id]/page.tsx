import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { CustomerNotes } from "./CustomerNotes";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { tenant } = await requireTenantAdmin(slug);
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
      <Link href={`/t/${slug}/admin/customers`}><Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4" /> Back</Button></Link>
      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
          <CardDescription>{customer.email} · {customer.phone}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm">
          <div><span className="text-muted-foreground">Bookings:</span> {customer.bookings.length}</div>
          <div><span className="text-muted-foreground">Total spend:</span> {formatPrice(totalSpent, tenant.currency)}</div>
          <div><span className="text-muted-foreground">Customer since:</span> {format(customer.createdAt, "MMM yyyy")}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent><CustomerNotes id={customer.id} initial={customer.notes || ""} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Booking history</CardTitle></CardHeader>
        <CardContent className="p-0">
          {customer.bookings.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No bookings.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                <tr><th className="p-2">When</th><th className="p-2">Service</th><th className="p-2">Staff</th><th className="p-2">Status</th><th className="p-2">Price</th></tr>
              </thead>
              <tbody className="divide-y">
                {customer.bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="p-2">{format(b.startTime, "MMM d, yyyy h:mm a")}</td>
                    <td className="p-2">{b.service.name}</td>
                    <td className="p-2">{b.staff?.name || "—"}</td>
                    <td className="p-2"><Badge variant={b.status === "confirmed" ? "success" : "secondary"}>{b.status}</Badge></td>
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

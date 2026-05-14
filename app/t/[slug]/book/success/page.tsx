import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookingSuccess({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { slug } = await params;
  const { id } = await searchParams;
  if (!id) notFound();

  const booking = await prisma.booking.findFirst({
    where: { id, tenant: { slug } },
    include: { service: true, staff: true, tenant: { select: { name: true, currency: true } } },
  });
  if (!booking) notFound();

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <Card className="max-w-md w-full">
        <div className="gold-rule" />
        <CardHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-sage/15 grid place-items-center mb-2">
            <Check className="w-6 h-6 text-sage" />
          </div>
          <CardTitle className="font-display text-3xl font-light text-center">
            {booking.paymentStatus === "paid" ? "Payment received" : "Booking received"}
          </CardTitle>
          <CardDescription className="text-center leading-relaxed">
            {booking.paymentStatus === "paid"
              ? "Your appointment is confirmed. We've emailed you a receipt."
              : "Your payment is processing. We'll email you as soon as it's confirmed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div><span className="text-muted-foreground">Studio:</span> {booking.tenant.name}</div>
          <div><span className="text-muted-foreground">Service:</span> {booking.service.name}</div>
          {booking.staff && <div><span className="text-muted-foreground">With:</span> {booking.staff.name}</div>}
          <div><span className="text-muted-foreground">When:</span> {format(booking.startTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
          <div><span className="text-muted-foreground">Paid:</span> {formatPrice(booking.amountPaidCents || booking.amountDueCents, booking.tenant.currency)}</div>
          <div><span className="text-muted-foreground">Confirmation #:</span> {booking.id.slice(-8).toUpperCase()}</div>
          <div className="pt-4">
            <Link href="/"><Button variant="outline" className="w-full">Back to {booking.tenant.name}</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

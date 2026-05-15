import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatInTenantTz } from "@/lib/datetime";

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
    include: { service: true, staff: true, tenant: { select: { name: true, currency: true, timezone: true, defaultLocale: true } } },
  });
  if (!booking) notFound();

  const t = await getTranslations("success");
  const paid = booking.paymentStatus === "paid";

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <Card className="max-w-md w-full">
        <div className="gold-rule" />
        <CardHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-sage/15 grid place-items-center mb-2">
            <Check className="w-6 h-6 text-sage" />
          </div>
          <CardTitle className="font-display text-3xl font-light text-center">
            {paid ? t("titlePaid") : t("titlePending")}
          </CardTitle>
          <CardDescription className="text-center leading-relaxed">
            {paid ? t("descriptionPaid") : t("descriptionPending")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div><span className="text-muted-foreground">{t("rowStudio")}:</span> {booking.tenant.name}</div>
          <div><span className="text-muted-foreground">{t("rowService")}:</span> {booking.service.name}</div>
          {booking.staff && <div><span className="text-muted-foreground">{t("rowWith")}:</span> {booking.staff.name}</div>}
          <div><span className="text-muted-foreground">{t("rowWhen")}:</span> {formatInTenantTz(booking.startTime, booking.tenant, "full")}</div>
          <div><span className="text-muted-foreground">{t("rowPaid")}:</span> {formatPrice(booking.amountPaidCents || booking.amountDueCents, booking.tenant.currency)}</div>
          <div><span className="text-muted-foreground">{t("rowConfirmationNumber")}:</span> {booking.id.slice(-8).toUpperCase()}</div>
          <div className="pt-4">
            <Link href="/"><Button variant="outline" className="w-full">{t("backTo", { tenant: booking.tenant.name })}</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

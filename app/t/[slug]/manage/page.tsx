import { notFound } from "next/navigation";
import { differenceInHours } from "date-fns";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { verifyBookingManageToken } from "@/lib/booking-tokens";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPrice, formatDuration } from "@/lib/utils";
import { formatInTenantTz } from "@/lib/datetime";
import { CancelButton } from "./CancelButton";

export const dynamic = "force-dynamic";

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const { t: token } = await searchParams;
  const tr = await getTranslations("manage");
  if (!token) notFound();

  const bookingId = await verifyBookingManageToken(token);
  if (!bookingId) {
    return (
      <Centered>
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{tr("linkExpiredTitle")}</CardTitle>
            <CardDescription>{tr("linkExpiredDescription")}</CardDescription>
          </CardHeader>
        </Card>
      </Centered>
    );
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    include: { service: true, staff: true, tenant: true },
  });
  if (!booking || booking.tenant.slug !== slug) notFound();

  const tenant = booking.tenant;
  const hoursUntilStart = differenceInHours(booking.startTime, new Date());
  const withinCancelWindow = hoursUntilStart >= tenant.cancellationWindowHours;
  const isCancellable =
    (booking.status === "confirmed" || booking.status === "pending") &&
    new Date() < booking.startTime;

  const outsideContact = tenant.phone
    ? tr("outsideWindowPhone", { phone: tenant.phone })
    : tenant.email
      ? tr("outsideWindowEmail", { email: tenant.email })
      : "";

  return (
    <Centered>
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{tenant.name}</div>
          <CardTitle className="font-display text-3xl font-light">{tr("title")}</CardTitle>
          <CardDescription>{tr("confirmationNumber", { number: booking.id.slice(-8).toUpperCase() })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label={tr("rowService")} value={booking.service.name} />
          {booking.staff && <Row label={tr("rowWith")} value={booking.staff.name} />}
          <Row label={tr("rowWhen")} value={formatInTenantTz(booking.startTime, tenant, "full")} />
          <Row label={tr("rowDuration")} value={formatDuration(booking.service.durationMinutes)} />
          <Row label={tr("rowTotal")} value={formatPrice(booking.priceCents, tenant.currency)} />
          <Row label={tr("rowStatus")} value={statusLabel(booking.status, tr)} />

          <div className="pt-4 border-t">
            {booking.status === "cancelled" ? (
              <p className="text-sm text-muted-foreground">{tr("alreadyCancelled")}</p>
            ) : booking.status === "completed" ? (
              <p className="text-sm text-muted-foreground">{tr("alreadyCompleted")}</p>
            ) : !isCancellable ? (
              <p className="text-sm text-muted-foreground">{tr("inThePast")}</p>
            ) : !withinCancelWindow ? (
              <p className="text-sm text-muted-foreground">
                {tr("outsideWindow", {
                  hours: tenant.cancellationWindowHours,
                  tenant: tenant.name,
                  contact: outsideContact,
                })}
              </p>
            ) : (
              <CancelButton slug={tenant.slug} token={token} />
            )}
          </div>
        </CardContent>
      </Card>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background grid place-items-center p-6">{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function statusLabel(s: string, tr: (key: string) => string) {
  switch (s) {
    case "confirmed": return tr("statusConfirmed");
    case "pending":   return tr("statusPending");
    case "cancelled": return tr("statusCancelled");
    case "completed": return tr("statusCompleted");
    case "no_show":   return tr("statusNoShow");
    default:          return s;
  }
}

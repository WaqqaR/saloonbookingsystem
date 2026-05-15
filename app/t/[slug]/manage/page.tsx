import { notFound } from "next/navigation";
import { format, differenceInHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { verifyBookingManageToken } from "@/lib/booking-tokens";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPrice, formatDuration } from "@/lib/utils";
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
  const { t } = await searchParams;
  if (!t) notFound();

  const bookingId = await verifyBookingManageToken(t);
  if (!bookingId) {
    return (
      <Centered>
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Link expired</CardTitle>
            <CardDescription>This management link is invalid or has expired. Please contact the shop.</CardDescription>
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

  return (
    <Centered>
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{tenant.name}</div>
          <CardTitle className="font-display text-3xl font-light">Your appointment</CardTitle>
          <CardDescription>Confirmation #{booking.id.slice(-8).toUpperCase()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label="Service" value={booking.service.name} />
          {booking.staff && <Row label="With" value={booking.staff.name} />}
          <Row label="When" value={format(booking.startTime, "EEEE, MMMM d 'at' h:mm a")} />
          <Row label="Duration" value={formatDuration(booking.service.durationMinutes)} />
          <Row label="Total" value={formatPrice(booking.priceCents, tenant.currency)} />
          <Row label="Status" value={statusLabel(booking.status)} />

          <div className="pt-4 border-t">
            {booking.status === "cancelled" ? (
              <p className="text-sm text-muted-foreground">This appointment has been cancelled.</p>
            ) : booking.status === "completed" ? (
              <p className="text-sm text-muted-foreground">This appointment has been completed. Hope to see you again.</p>
            ) : !isCancellable ? (
              <p className="text-sm text-muted-foreground">This appointment is in the past.</p>
            ) : !withinCancelWindow ? (
              <p className="text-sm text-muted-foreground">
                Cancellations must be made at least {tenant.cancellationWindowHours} hours in advance. To cancel within this window, please contact {tenant.name}
                {tenant.phone ? ` on ${tenant.phone}` : tenant.email ? ` at ${tenant.email}` : ""}.
              </p>
            ) : (
              <CancelButton slug={tenant.slug} token={t} />
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

function statusLabel(s: string) {
  switch (s) {
    case "confirmed": return "Confirmed";
    case "pending": return "Awaiting payment";
    case "cancelled": return "Cancelled";
    case "completed": return "Completed";
    case "no_show": return "No-show";
    default: return s;
  }
}

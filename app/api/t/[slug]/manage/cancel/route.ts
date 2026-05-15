import { NextRequest, NextResponse } from "next/server";
import { differenceInHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { verifyBookingManageToken } from "@/lib/booking-tokens";
import { getStripe, stripeEnabled } from "@/lib/stripe";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { token } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const bookingId = await verifyBookingManageToken(token);
  if (!bookingId) return NextResponse.json({ error: "Link expired" }, { status: 401 });

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    include: { tenant: true },
  });
  if (!booking || booking.tenant.slug !== slug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }
  if (booking.status === "completed" || booking.status === "no_show") {
    return NextResponse.json({ error: "This appointment cannot be cancelled." }, { status: 400 });
  }
  if (new Date() >= booking.startTime) {
    return NextResponse.json({ error: "This appointment has already started." }, { status: 400 });
  }

  const hoursUntilStart = differenceInHours(booking.startTime, new Date());
  if (hoursUntilStart < booking.tenant.cancellationWindowHours) {
    return NextResponse.json({
      error: `Cancellations must be made at least ${booking.tenant.cancellationWindowHours} hours in advance.`,
    }, { status: 403 });
  }

  // If they paid and Stripe is configured, attempt a refund. We don't block
  // the cancellation if the refund fails — the salon owner will see the
  // booking marked cancelled and can sort the refund manually.
  let refundResult: "refunded" | "pending_manual" | "not_applicable" = "not_applicable";
  if (
    booking.paymentStatus === "paid" &&
    booking.stripePaymentIntent &&
    stripeEnabled() &&
    booking.tenant.stripeConnectAccountId
  ) {
    try {
      const stripe = getStripe()!;
      await stripe.refunds.create(
        { payment_intent: booking.stripePaymentIntent },
        { stripeAccount: booking.tenant.stripeConnectAccountId },
      );
      refundResult = "refunded";
    } catch (e) {
      console.error("Self-serve refund failed:", e);
      refundResult = "pending_manual";
    }
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "cancelled",
      paymentStatus: refundResult === "refunded" ? "refunded" : booking.paymentStatus,
    },
  });

  return NextResponse.json({ ok: true, refundResult });
}

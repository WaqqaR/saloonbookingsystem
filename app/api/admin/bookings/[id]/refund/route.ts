import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStripe, stripeEnabled } from "@/lib/stripe";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, tenantId: session.tenantId },
    include: { tenant: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.paymentStatus !== "paid") {
    return NextResponse.json({ error: "This booking hasn't been paid yet — nothing to refund." }, { status: 400 });
  }
  if (!booking.stripePaymentIntent) {
    return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
  }
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }
  if (!booking.tenant.stripeConnectAccountId) {
    return NextResponse.json({ error: "Shop is not connected to Stripe." }, { status: 503 });
  }

  const stripe = getStripe()!;
  try {
    const refund = await stripe.refunds.create(
      { payment_intent: booking.stripePaymentIntent },
      { stripeAccount: booking.tenant.stripeConnectAccountId }
    );

    await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: "refunded",
        status: booking.status === "confirmed" ? "cancelled" : booking.status,
      },
    });

    return NextResponse.json({ ok: true, refundId: refund.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Refund failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/email";
import { sendBookingConfirmationSms } from "@/lib/sms";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: true, skipped: true });

  const sig = req.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 });

  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Bad signature: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    // -------- Platform subscription (the salon owner pays us) --------
    case "checkout.session.completed": {
      const s = event.data.object as any;
      if (s.mode === "subscription") {
        // Owner finished signing up.
        const customerId = s.customer as string;
        const subscriptionId = s.subscription as string;
        if (customerId && subscriptionId) {
          await prisma.tenant.updateMany({
            where: { stripeCustomerId: customerId },
            data: { stripeSubscriptionId: subscriptionId, subscriptionStatus: "active" },
          });
        }
      } else if (s.mode === "payment") {
        // Customer paid for a booking (on a connected account).
        const bookingId = s.metadata?.bookingId as string | undefined;
        if (bookingId) {
          const amount = s.amount_total as number | null;
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: "confirmed",
              paymentStatus: "paid",
              amountPaidCents: amount || 0,
              stripePaymentIntent: s.payment_intent as string | undefined,
              expiresAt: null,
            },
          });
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
              service: true,
              staff: true,
              tenant: { select: { name: true, slug: true, currency: true, email: true, emailRemindersEnabled: true, smsRemindersEnabled: true } },
            },
          });
          if (booking) {
            if (booking.tenant.emailRemindersEnabled) {
              sendBookingConfirmation(booking).catch((e) => console.error("Email failed:", e));
            }
            if (booking.tenant.smsRemindersEnabled) {
              sendBookingConfirmationSms({ ...booking, tenant: { name: booking.tenant.name, slug: booking.tenant.slug } })
                .catch((e) => console.error("SMS failed:", e));
            }
          }
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const s = event.data.object as any;
      const bookingId = s.metadata?.bookingId as string | undefined;
      if (bookingId) {
        await prisma.booking.updateMany({
          where: { id: bookingId, status: "pending" },
          data: { status: "cancelled", paymentStatus: "failed" },
        });
      }
      break;
    }

    // -------- Platform subscription state changes --------
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
      await prisma.tenant.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: {
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items?.data?.[0]?.price?.id,
          subscriptionStatus: sub.status,
          seatCount: sub.items?.data?.[0]?.quantity || 1,
        },
      });
      break;
    }

    // -------- Refunds (initiated anywhere — our UI, Stripe dashboard) --------
    case "charge.refunded": {
      const ch = event.data.object as any;
      const pi = ch.payment_intent as string | undefined;
      if (pi) {
        await prisma.booking.updateMany({
          where: { stripePaymentIntent: pi },
          data: {
            paymentStatus: ch.amount_refunded >= ch.amount ? "refunded" : "paid",
            // Fully refunded -> cancel the appointment as well.
            ...(ch.amount_refunded >= ch.amount ? { status: "cancelled" } : {}),
          },
        });
      }
      break;
    }

    // -------- Connect account updates --------
    case "account.updated": {
      const account = event.data.object as any;
      await prisma.tenant.updateMany({
        where: { stripeConnectAccountId: account.id },
        data: {
          stripeConnectChargesEnabled: account.charges_enabled || false,
          stripeConnectPayoutsEnabled: account.payouts_enabled || false,
        },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

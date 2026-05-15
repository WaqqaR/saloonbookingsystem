import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";
import { isSlotAvailable } from "@/lib/availability";
import { sendBookingConfirmation } from "@/lib/email";
import { sendBookingConfirmationSms } from "@/lib/sms";
import { createBookingCheckoutSession } from "@/lib/connect";
import { tenantUrl } from "@/lib/tenant";
import { stripeEnabled } from "@/lib/stripe";
import { normalizePhoneE164 } from "@/lib/phone";

const schema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().nullable().optional(),
  startTime: z.string().min(1),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(5).max(30),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404, headers: cors() });

  if (!["active", "trialing"].includes(tenant.subscriptionStatus)) {
    return NextResponse.json({ error: "This shop is not currently accepting bookings." }, { status: 403, headers: cors() });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400, headers: cors() });

  const { serviceId, staffId, startTime, customerName, customerEmail, notes } = parsed.data;

  const customerPhone = normalizePhoneE164(parsed.data.customerPhone);
  if (!customerPhone) {
    return NextResponse.json({ error: "Please enter a valid phone number (include the country code, e.g. +44...)." }, { status: 400, headers: cors() });
  }

  const service = await prisma.service.findFirst({ where: { id: serviceId, tenantId: tenant.id, active: true } });
  if (!service) return NextResponse.json({ error: "Service not available" }, { status: 404, headers: cors() });

  const available = await isSlotAvailable({ tenantId: tenant.id, serviceId, startISO: startTime, staffId });
  if (!available) return NextResponse.json({ error: "That time is no longer available" }, { status: 409, headers: cors() });

  const start = new Date(startTime);
  const end = addMinutes(start, service.durationMinutes);

  // Upsert customer (dedupe by email per-tenant).
  const customer = await prisma.customer.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: customerEmail.toLowerCase() } },
    update: { name: customerName, phone: customerPhone },
    create: { tenantId: tenant.id, name: customerName, email: customerEmail.toLowerCase(), phone: customerPhone },
  });

  // Compute amount due based on service payment mode.
  const requiresPayment = service.paymentMode !== "none";
  const amountDueCents =
    service.paymentMode === "full" ? service.priceCents :
    service.paymentMode === "deposit" ? Math.min(service.depositCents, service.priceCents) :
    0;

  // If payment is required but the shop has not set up Connect, fail fast.
  if (requiresPayment) {
    if (!stripeEnabled()) {
      return NextResponse.json({ error: "Payments are not configured. Contact the shop." }, { status: 503, headers: cors() });
    }
    if (!tenant.stripeConnectChargesEnabled) {
      return NextResponse.json({ error: "This shop hasn't finished setting up payments yet." }, { status: 503, headers: cors() });
    }
  }

  const booking = await prisma.booking.create({
    data: {
      tenantId: tenant.id,
      serviceId,
      staffId: staffId || null,
      customerId: customer.id,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone,
      notes,
      startTime: start,
      endTime: end,
      priceCents: service.priceCents,
      status: requiresPayment ? "pending" : "confirmed",
      paymentStatus: requiresPayment ? "pending" : "none",
      amountDueCents,
      expiresAt: requiresPayment ? addMinutes(new Date(), 30) : null,
    },
    include: { service: true, staff: true, tenant: { select: { name: true, slug: true, currency: true, email: true } } },
  });

  if (requiresPayment) {
    try {
      const desc = `${service.name}${service.paymentMode === "deposit" ? " (deposit)" : ""} — ${tenant.name}`;
      const session = await createBookingCheckoutSession({
        tenantId: tenant.id,
        bookingId: booking.id,
        amountCents: amountDueCents,
        currency: tenant.currency,
        successUrl: tenantUrl(tenant.slug, `/book/success?id=${booking.id}`),
        cancelUrl: tenantUrl(tenant.slug, `/book/cancelled?id=${booking.id}`),
        customerEmail: customerEmail.toLowerCase(),
        description: desc,
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripeCheckoutId: session.id },
      });
      return NextResponse.json({ booking, checkoutUrl: session.url }, { headers: cors() });
    } catch (e: any) {
      // Roll back the booking if Checkout fails.
      await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
      return NextResponse.json({ error: e.message || "Could not create checkout" }, { status: 500, headers: cors() });
    }
  }

  // No payment required — confirm immediately, email + optional SMS.
  if (tenant.emailRemindersEnabled) {
    sendBookingConfirmation(booking).catch((e) => console.error("Email failed:", e));
  }
  if (tenant.smsRemindersEnabled) {
    sendBookingConfirmationSms({ ...booking, tenant: { name: booking.tenant.name, slug: booking.tenant.slug } })
      .catch((e) => console.error("SMS failed:", e));
  }
  return NextResponse.json({ booking }, { headers: cors() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

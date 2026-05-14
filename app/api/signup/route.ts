import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, isValidSlug } from "@/lib/auth";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { tenantUrl, appUrl } from "@/lib/tenant";
import { addDays } from "date-fns";

const schema = z.object({
  shopName: z.string().min(2).max(80),
  slug: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { shopName, slug, email, password } = parsed.data;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid or reserved subdomain" }, { status: 400 });
  }

  const slugExists = await prisma.tenant.findUnique({ where: { slug } });
  if (slugExists) return NextResponse.json({ error: "Subdomain already taken" }, { status: 409 });

  const emailExists = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (emailExists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const trialDays = Number(process.env.STRIPE_TRIAL_DAYS || "14");
  const passwordHash = await hashPassword(password);

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: shopName,
      email: email.toLowerCase(),
      subscriptionStatus: "trialing",
      seatCount: 1,
      trialEndsAt: addDays(new Date(), trialDays),
      users: { create: { email: email.toLowerCase(), passwordHash, role: "owner", name: shopName } },
      businessHours: {
        create: defaultHours(),
      },
      services: {
        create: [
          { name: "Men's Haircut", durationMinutes: 30, priceCents: 2500, category: "Hair", sortOrder: 1 },
          { name: "Beard Trim", durationMinutes: 20, priceCents: 1500, category: "Grooming", sortOrder: 2 },
        ],
      },
    },
    include: { users: true },
  });

  const user = tenant.users[0];
  const sessionPayload = {
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    role: user.role,
    email: user.email,
  };

  await createSession(sessionPayload);

  // If Stripe is configured, create a customer and a Checkout session for the subscription.
  if (stripeEnabled()) {
    const stripe = getStripe()!;
    const customer = await stripe.customers.create({
      email: tenant.email,
      name: tenant.name,
      metadata: { tenantId: tenant.id, slug: tenant.slug },
    });
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      subscription_data: { trial_period_days: trialDays },
      success_url: tenantUrl(slug, "/admin?welcome=1"),
      cancel_url: appUrl("/signup?canceled=1"),
      allow_promotion_codes: true,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  }

  const adminUrl = tenantUrl(slug, "/admin?welcome=1");
  return NextResponse.json({ adminUrl });
}

function defaultHours() {
  return [
    { dayOfWeek: 0, open: false, openTime: "10:00", closeTime: "16:00" },
    { dayOfWeek: 1, open: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 2, open: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 3, open: true, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 4, open: true, openTime: "09:00", closeTime: "20:00" },
    { dayOfWeek: 5, open: true, openTime: "09:00", closeTime: "20:00" },
    { dayOfWeek: 6, open: true, openTime: "10:00", closeTime: "17:00" },
  ];
}

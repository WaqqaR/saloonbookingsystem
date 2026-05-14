import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { tenantUrl } from "@/lib/tenant";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripeEnabled()) return NextResponse.json({ error: "Billing not configured" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant?.stripeCustomerId) return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });

  const stripe = getStripe()!;
  const portal = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: tenantUrl(tenant.slug, "/admin/billing"),
  });
  return NextResponse.json({ url: portal.url });
}

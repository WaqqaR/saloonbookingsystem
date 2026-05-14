import { prisma } from "./prisma";
import { getStripe, stripeEnabled } from "./stripe";
import { tenantUrl } from "./tenant";
import type Stripe from "stripe";

/**
 * Create or fetch a Stripe Connect Express account for the tenant
 * and return an onboarding link the owner must complete.
 */
export async function getOnboardingLink(tenantId: string): Promise<string> {
  if (!stripeEnabled()) throw new Error("Stripe is not configured");
  const stripe = getStripe()!;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  let accountId = tenant.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "GB",
      email: tenant.email,
      business_type: "company",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { tenantId: tenant.id, slug: tenant.slug },
    });
    accountId = account.id;
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: tenantUrl(tenant.slug, "/admin/payments?onboarded=1"),
    refresh_url: tenantUrl(tenant.slug, "/admin/payments?refresh=1"),
    type: "account_onboarding",
  });

  return link.url;
}

/** Refresh tenant Connect status from Stripe (called after onboarding). */
export async function refreshConnectStatus(tenantId: string) {
  if (!stripeEnabled()) return null;
  const stripe = getStripe()!;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant?.stripeConnectAccountId) return null;

  const account = await stripe.accounts.retrieve(tenant.stripeConnectAccountId);
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      stripeConnectChargesEnabled: account.charges_enabled || false,
      stripeConnectPayoutsEnabled: account.payouts_enabled || false,
    },
  });
}

/** Login link to the Stripe Express dashboard for the tenant. */
export async function getExpressDashboardLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

/**
 * Create a Checkout Session on behalf of the tenant's connected account
 * for a customer paying for a booking.
 */
export async function createBookingCheckoutSession(args: {
  tenantId: string;
  bookingId: string;
  amountCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  description: string;
}): Promise<{ url: string; id: string }> {
  if (!stripeEnabled()) throw new Error("Stripe is not configured");
  const stripe = getStripe()!;
  const tenant = await prisma.tenant.findUnique({ where: { id: args.tenantId } });
  if (!tenant?.stripeConnectAccountId || !tenant.stripeConnectChargesEnabled) {
    throw new Error("Payments not set up for this shop");
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: args.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: args.currency.toLowerCase(),
            unit_amount: args.amountCents,
            product_data: { name: args.description },
          },
        },
      ],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      payment_intent_data: {
        metadata: { bookingId: args.bookingId, tenantId: args.tenantId },
      },
      metadata: { bookingId: args.bookingId, tenantId: args.tenantId },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
    },
    { stripeAccount: tenant.stripeConnectAccountId }
  );

  return { url: session.url!, id: session.id };
}

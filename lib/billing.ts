import { prisma } from "./prisma";
import { getStripe, stripeEnabled } from "./stripe";

/** Recompute seat count from active staff and update Stripe subscription quantity. */
export async function syncSeats(tenantId: string) {
  const staffCount = await prisma.staff.count({ where: { tenantId, active: true } });
  const seats = Math.max(1, staffCount);

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { seatCount: seats },
  });

  if (!stripeEnabled() || !tenant.stripeSubscriptionId) return tenant;

  const stripe = getStripe()!;
  const sub = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
  const item = sub.items.data[0];
  if (item && item.quantity !== seats) {
    await stripe.subscriptionItems.update(item.id, { quantity: seats, proration_behavior: "create_prorations" });
  }
  return tenant;
}

export type SubscriptionState = {
  status: string;
  active: boolean;
  seats: number;
  trialEndsAt: Date | null;
  hasPaymentMethod: boolean;
};

export async function getSubscriptionState(tenantId: string): Promise<SubscriptionState> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");
  const active = ["active", "trialing"].includes(tenant.subscriptionStatus);
  return {
    status: tenant.subscriptionStatus,
    active,
    seats: tenant.seatCount,
    trialEndsAt: tenant.trialEndsAt,
    hasPaymentMethod: Boolean(tenant.stripeSubscriptionId),
  };
}

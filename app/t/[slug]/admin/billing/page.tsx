import { requireTenantAdmin } from "@/lib/admin-guard";
import { getSubscriptionState } from "@/lib/billing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingActions } from "./BillingActions";
import { stripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const sub = await getSubscriptionState(tenant.id);
  const monthlyPence = sub.seats * 1500;
  const enabled = stripeEnabled();

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>Per-chair monthly subscription.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={sub.active ? "success" : "destructive"}>{sub.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active staff (seats)</span>
            <span>{sub.seats}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly cost</span>
            <span className="font-semibold">£{(monthlyPence / 100).toFixed(2)}</span>
          </div>
          {sub.trialEndsAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trial ends</span>
              <span>{new Date(sub.trialEndsAt).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage payment & invoices</CardTitle>
          <CardDescription>Update card, view invoices, or cancel your subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          {!enabled ? (
            <p className="text-sm text-muted-foreground">
              Stripe is not configured in this environment. Set <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_PRICE_ID</code> in your env to enable billing.
            </p>
          ) : (
            <BillingActions />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

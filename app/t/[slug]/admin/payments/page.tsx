import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentsActions } from "./PaymentsActions";
import { refreshConnectStatus } from "@/lib/connect";
import { stripeEnabled } from "@/lib/stripe";
import { CreditCard, CheckCircle2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ onboarded?: string; refresh?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { tenant } = await requireTenantAdmin(slug);

  // If returning from Stripe onboarding, refresh status.
  if (sp.onboarded || sp.refresh) {
    await refreshConnectStatus(tenant.id);
  }

  const fresh = await (await import("@/lib/prisma")).prisma.tenant.findUnique({ where: { id: tenant.id } });
  const enabled = stripeEnabled();
  const hasAccount = Boolean(fresh?.stripeConnectAccountId);
  const charges = Boolean(fresh?.stripeConnectChargesEnabled);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium mb-2">Customer payments</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Collect deposits or full payment from customers when they book. Money goes directly to your Stripe account.
        </p>
      </div>

      {!enabled && (
        <Card className="border-amber-300/50 bg-amber-50/50">
          <CardContent className="p-4 text-sm flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-700" />
            <div>
              <p className="font-medium text-amber-900">Stripe not configured</p>
              <p className="text-amber-800 mt-1">
                Payments are disabled because <code>STRIPE_SECRET_KEY</code> is not set in this environment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="gold-rule" />
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" /> Stripe account
          </CardTitle>
          <CardDescription>
            We use Stripe Connect — money lands in your Stripe account directly, with payouts to your bank.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Connection</span>
            {charges ? (
              <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected & taking payments</Badge>
            ) : hasAccount ? (
              <Badge variant="secondary">Onboarding incomplete</Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>

          {enabled && <PaymentsActions hasAccount={hasAccount} charges={charges} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">How payments work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>1. Connect your Stripe account (one-time, takes about 2 minutes).</p>
          <p>2. On each service, choose how you&apos;d like to collect payment: nothing, a deposit, or the full amount.</p>
          <p>3. Customers are taken to Stripe&apos;s secure checkout when they book a service that requires payment. Their booking is held for 30 minutes until they pay.</p>
          <p>4. Confirmed bookings appear in your dashboard. Refunds, disputes, and payouts are managed in your Stripe dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}

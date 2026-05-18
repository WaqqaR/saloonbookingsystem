import { requireTenantAdmin } from "@/lib/admin-guard";
import { getSubscriptionState } from "@/lib/billing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingActions } from "./BillingActions";
import { stripeEnabled } from "@/lib/stripe";
import { getTranslations } from "next-intl/server";
import { formatInTenantTz } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function BillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const sub = await getSubscriptionState(tenant.id);
  const monthlyPence = sub.seats * 1500;
  const enabled = stripeEnabled();
  const t = await getTranslations("admin.billing");

  const statusKeys: Record<string, string> = {
    trialing: "statusTrialing",
    active: "statusActive",
    past_due: "statusPastDue",
    canceled: "statusCanceled",
    incomplete: "statusIncomplete",
  };
  const statusLabel = statusKeys[sub.status] ? t(statusKeys[sub.status]) : sub.status;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("currentPlan")}</CardTitle>
          <CardDescription>{t("currentPlanDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("statusLabel")}</span>
            <Badge variant={sub.active ? "success" : "destructive"}>{statusLabel}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("activeSeats")}</span>
            <span>{sub.seats}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("monthlyCost")}</span>
            <span className="font-semibold">£{(monthlyPence / 100).toFixed(2)}</span>
          </div>
          {sub.trialEndsAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("trialEnds")}</span>
              <span>{formatInTenantTz(sub.trialEndsAt, tenant, "dateMedium")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("manageTitle")}</CardTitle>
          <CardDescription>{t("manageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {!enabled ? (
            <p className="text-sm text-muted-foreground">
              {t.rich("stripeNotConfigured", {
                secret: () => <code>STRIPE_SECRET_KEY</code>,
                price: () => <code>STRIPE_PRICE_ID</code>,
              })}
            </p>
          ) : (
            <BillingActions />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

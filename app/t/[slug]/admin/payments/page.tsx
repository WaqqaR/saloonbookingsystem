import { requireTenantAdmin } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentsActions } from "./PaymentsActions";
import { refreshConnectStatus } from "@/lib/connect";
import { stripeEnabled } from "@/lib/stripe";
import { CreditCard, CheckCircle2, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("admin.payments");

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
        <h1 className="font-display text-3xl font-medium mb-2">{t("title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("intro")}
        </p>
      </div>

      {!enabled && (
        <Card className="border-amber-300/50 bg-amber-50/50">
          <CardContent className="p-4 text-sm flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-700" />
            <div>
              <p className="font-medium text-amber-900">{t("notConfiguredTitle")}</p>
              <p className="text-amber-800 mt-1">
                {t.rich("notConfiguredDesc", { secret: () => <code>STRIPE_SECRET_KEY</code> })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="gold-rule" />
        <CardHeader>
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" /> {t("stripeAccount")}
          </CardTitle>
          <CardDescription>
            {t("stripeAccountDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("connection")}</span>
            {charges ? (
              <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t("connected")}</Badge>
            ) : hasAccount ? (
              <Badge variant="secondary">{t("onboardingIncomplete")}</Badge>
            ) : (
              <Badge variant="outline">{t("notConnected")}</Badge>
            )}
          </div>

          {enabled && <PaymentsActions hasAccount={hasAccount} charges={charges} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">{t("howItWorks")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>{t("step1")}</p>
          <p>{t("step2")}</p>
          <p>{t("step3")}</p>
          <p>{t("step4")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

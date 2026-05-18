import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { getSubscriptionState } from "@/lib/billing";
import { formatInTenantTz } from "@/lib/datetime";
import { Wordmark } from "@/components/wordmark";
import {
  Scissors,
  Calendar,
  Package,
  Clock,
  LogOut,
  LayoutDashboard,
  Users,
  Code,
  CreditCard,
  UserCircle,
  TrendingUp,
  Settings,
} from "lucide-react";

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenantAdmin(slug);
  const sub = await getSubscriptionState(tenant.id);
  const t = await getTranslations("admin.nav");

  const trialing = sub.status === "trialing";
  const past_due = sub.status === "past_due";

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 bg-card border-e border-border/60 flex flex-col">
        <div className="p-5 border-b border-border/60">
          <div className="font-display text-xl font-medium tracking-wide truncate">{tenant.name}</div>
          <div className="text-xs text-muted-foreground mt-1 tracking-wide">{tenant.slug}.{(process.env.APP_BASE_DOMAIN || "lvh.me:3000").split(":")[0]}</div>
          <div className="mt-3 pt-3 border-t border-border/60 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            {t("poweredBy")} <Wordmark size="sm" className="!text-xs not-italic-inline" />
          </div>
        </div>
        <nav className="flex-1 p-2 text-sm space-y-1">
          <NavLink href={`/t/${slug}/admin`} icon={<LayoutDashboard className="w-4 h-4" />}>{t("dashboard")}</NavLink>
          <NavLink href={`/t/${slug}/admin/calendar`} icon={<Calendar className="w-4 h-4" />}>{t("diary")}</NavLink>
          <NavLink href={`/t/${slug}/admin/bookings`} icon={<Calendar className="w-4 h-4" />}>{t("bookings")}</NavLink>
          <NavLink href={`/t/${slug}/admin/customers`} icon={<UserCircle className="w-4 h-4" />}>{t("customers")}</NavLink>
          <NavLink href={`/t/${slug}/admin/services`} icon={<Scissors className="w-4 h-4" />}>{t("services")}</NavLink>
          <NavLink href={`/t/${slug}/admin/products`} icon={<Package className="w-4 h-4" />}>{t("products")}</NavLink>
          <NavLink href={`/t/${slug}/admin/staff`} icon={<Users className="w-4 h-4" />}>{t("staff")}</NavLink>
          <NavLink href={`/t/${slug}/admin/availability`} icon={<Clock className="w-4 h-4" />}>{t("hoursBlocks")}</NavLink>
          <NavLink href={`/t/${slug}/admin/reports`} icon={<TrendingUp className="w-4 h-4" />}>{t("reports")}</NavLink>
          <NavLink href={`/t/${slug}/admin/settings`} icon={<Settings className="w-4 h-4" />}>{t("settings")}</NavLink>
          <NavLink href={`/t/${slug}/admin/embed`} icon={<Code className="w-4 h-4" />}>{t("embed")}</NavLink>
          <NavLink href={`/t/${slug}/admin/payments`} icon={<CreditCard className="w-4 h-4" />}>{t("customerPayments")}</NavLink>
          <NavLink href={`/t/${slug}/admin/billing`} icon={<CreditCard className="w-4 h-4" />}>{t("subscription")}</NavLink>
        </nav>
        <form action="/api/logout" method="post" className="p-2 border-t">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-secondary">
            <LogOut className="w-4 h-4" /> {t("signOut")}
          </button>
        </form>
      </aside>
      <main className="flex-1 overflow-auto">
        {trialing && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm flex items-center justify-between">
            <span>{t("trialBanner", { until: sub.trialEndsAt ? t("trialUntil", { date: formatInTenantTz(sub.trialEndsAt, tenant, "dateMedium") }) : "" })}</span>
            <Link href={`/t/${slug}/admin/billing`} className="underline font-medium">{t("addPaymentMethod")}</Link>
          </div>
        )}
        {past_due && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-900 text-sm flex items-center justify-between">
            <span>{t("pastDueBanner")}</span>
            <Link href={`/t/${slug}/admin/billing`} className="underline font-medium">{t("updatePayment")}</Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-secondary">
      {icon}
      {children}
    </Link>
  );
}

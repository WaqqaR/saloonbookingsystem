import Link from "next/link";
import { requireTenantAdmin } from "@/lib/admin-guard";
import { getSubscriptionState } from "@/lib/billing";
import { Badge } from "@/components/ui/badge";
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

  const trialing = sub.status === "trialing";
  const past_due = sub.status === "past_due";

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 bg-card border-r border-border/60 flex flex-col">
        <div className="p-5 border-b border-border/60">
          <div className="font-display text-xl font-medium tracking-wide truncate">{tenant.name}</div>
          <div className="text-xs text-muted-foreground mt-1 tracking-wide">{tenant.slug}.{(process.env.APP_BASE_DOMAIN || "lvh.me:3000").split(":")[0]}</div>
          <div className="mt-3 pt-3 border-t border-border/60 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            powered by <Wordmark size="sm" className="!text-xs not-italic-inline" />
          </div>
        </div>
        <nav className="flex-1 p-2 text-sm space-y-1">
          <NavLink href={`/admin`} icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</NavLink>
          <NavLink href={`/admin/calendar`} icon={<Calendar className="w-4 h-4" />}>Diary</NavLink>
          <NavLink href={`/admin/bookings`} icon={<Calendar className="w-4 h-4" />}>Bookings</NavLink>
          <NavLink href={`/admin/customers`} icon={<UserCircle className="w-4 h-4" />}>Customers</NavLink>
          <NavLink href={`/admin/services`} icon={<Scissors className="w-4 h-4" />}>Services</NavLink>
          <NavLink href={`/admin/products`} icon={<Package className="w-4 h-4" />}>Products</NavLink>
          <NavLink href={`/admin/staff`} icon={<Users className="w-4 h-4" />}>Staff</NavLink>
          <NavLink href={`/admin/availability`} icon={<Clock className="w-4 h-4" />}>Hours & Blocks</NavLink>
          <NavLink href={`/admin/reports`} icon={<TrendingUp className="w-4 h-4" />}>Reports</NavLink>
          <NavLink href={`/admin/settings`} icon={<Settings className="w-4 h-4" />}>Settings</NavLink>
          <NavLink href={`/admin/embed`} icon={<Code className="w-4 h-4" />}>Embed</NavLink>
          <NavLink href={`/admin/payments`} icon={<CreditCard className="w-4 h-4" />}>Customer payments</NavLink>
          <NavLink href={`/admin/billing`} icon={<CreditCard className="w-4 h-4" />}>Subscription</NavLink>
        </nav>
        <form action="/api/logout" method="post" className="p-2 border-t">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-secondary">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 overflow-auto">
        {trialing && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm flex items-center justify-between">
            <span>You&apos;re on a free trial{sub.trialEndsAt ? ` until ${new Date(sub.trialEndsAt).toLocaleDateString()}` : ""}.</span>
            <Link href={`/admin/billing`} className="underline font-medium">Add payment method</Link>
          </div>
        )}
        {past_due && (
          <div className="p-3 bg-red-50 border-b border-red-200 text-red-900 text-sm flex items-center justify-between">
            <span>Your subscription is past due. Bookings are paused.</span>
            <Link href={`/admin/billing`} className="underline font-medium">Update payment</Link>
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

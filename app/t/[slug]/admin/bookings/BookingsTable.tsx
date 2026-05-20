"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { formatInTenantTz } from "@/lib/datetime";
import { Loader2, X, RotateCcw, Check, UserX, Bell } from "lucide-react";

type Booking = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: string;
  status: string;
  paymentStatus: string;
  priceCents: number;
  amountDueCents: number;
  amountPaidCents: number;
  stripePaymentIntent: string | null;
  service: { name: string };
  staff: { name: string } | null;
};

export function BookingsTable({
  bookings,
  currency,
  defaultLocale,
  timezone,
}: {
  bookings: Booking[];
  currency: string;
  defaultLocale: string;
  timezone: string;
}) {
  const router = useRouter();
  const t = useTranslations("admin.bookings");
  const c = useTranslations("admin.common");
  const tz = { defaultLocale, timezone };
  const [busy, setBusy] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<Booking | null>(null);

  async function cancel(id: string) {
    if (!confirm(t("confirmCancel"))) return;
    setBusy(id);
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  async function sendReminder(id: string) {
    setBusy(id);
    const res = await fetch(`/api/admin/bookings/${id}/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channels: ["email"] }),
    });
    setBusy(null);
    if (res.ok) {
      const data = await res.json();
      const msgs = Object.entries(data.results).map(([k, v]) => `${k}: ${v}`).join("\n");
      alert(`${t("reminderSent")}\n\n${msgs}`);
      router.refresh();
    }
  }

  async function setStatus(id: string, status: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(id);
    await fetch(`/api/admin/bookings/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  async function refund() {
    if (!refundTarget) return;
    setBusy(refundTarget.id);
    const res = await fetch(`/api/admin/bookings/${refundTarget.id}/refund`, { method: "POST" });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || t("refundFailed"));
    } else {
      setRefundTarget(null);
      router.refresh();
    }
  }

  if (bookings.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="border-b bg-secondary/30 text-xs uppercase text-muted-foreground tracking-wider">
          <tr>
            <th className="text-start px-4 py-3">{t("colWhen")}</th>
            <th className="text-start px-4 py-3">{t("colCustomer")}</th>
            <th className="text-start px-4 py-3">{t("colServiceStaff")}</th>
            <th className="text-start px-4 py-3">{t("colStatus")}</th>
            <th className="text-start px-4 py-3">{t("colPayment")}</th>
            <th className="text-end px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-secondary/20">
              <td className="px-4 py-3">
                <div className="font-medium">{formatInTenantTz(b.startTime, tz, "dateMedium")}</div>
                <div className="text-muted-foreground text-xs">{formatInTenantTz(b.startTime, tz, "time")}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{b.customerName}</div>
                <div className="text-muted-foreground text-xs">{b.customerEmail}</div>
                <div className="text-muted-foreground text-xs">{b.customerPhone}</div>
              </td>
              <td className="px-4 py-3">
                <div>{b.service.name}</div>
                {b.staff && <div className="text-xs text-muted-foreground">{t("withStaff", { name: b.staff.name })}</div>}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={b.status} />
              </td>
              <td className="px-4 py-3">
                <PaymentBadge ps={b.paymentStatus} due={b.amountDueCents} paid={b.amountPaidCents} total={b.priceCents} currency={currency} />
              </td>
              <td className="px-4 py-3 text-end whitespace-nowrap">
                {b.status === "confirmed" && new Date(b.startTime) > new Date() && (
                  <Button size="sm" variant="ghost" disabled={busy === b.id}
                    onClick={() => sendReminder(b.id)} title={t("remindTitle")}>
                    <Bell className="w-3 h-3" /> {t("remind")}
                  </Button>
                )}
                {b.status === "confirmed" && new Date(b.startTime) < new Date() && (
                  <>
                    <Button size="sm" variant="ghost" disabled={busy === b.id}
                      onClick={() => setStatus(b.id, "completed")}
                      title={t("markCompletedTitle")}>
                      <Check className="w-3 h-3" /> {t("markDone")}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy === b.id}
                      onClick={() => setStatus(b.id, "no_show", t("confirmNoShow"))}
                      title={t("markNoShowTitle")}>
                      <UserX className="w-3 h-3" /> {t("markNoShow")}
                    </Button>
                  </>
                )}
                {b.paymentStatus === "paid" && (
                  <Button
                    size="sm" variant="ghost"
                    disabled={busy === b.id}
                    onClick={() => setRefundTarget(b)}
                    title={t("refundTitle")}
                  >
                    <RotateCcw className="w-3 h-3" /> {t("refund")}
                  </Button>
                )}
                {b.status !== "cancelled" && b.status !== "completed" && b.status !== "no_show" && (
                  <Button size="sm" variant="ghost" disabled={busy === b.id} onClick={() => cancel(b.id)}>
                    {busy === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    {busy === b.id ? t("working") : c("cancel")}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t("refundDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("refundDialogDescription", {
                amount: refundTarget ? formatPrice(refundTarget.amountPaidCents || refundTarget.amountDueCents, currency) : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRefundTarget(null)}>{c("cancel")}</Button>
            <Button onClick={refund} disabled={busy !== null} variant="destructive">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("refunding")}</> : t("refund")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("admin.bookings");
  switch (status) {
    case "confirmed": return <Badge variant="success">{t("statusConfirmed")}</Badge>;
    case "pending":   return <Badge variant="secondary">{t("statusPending")}</Badge>;
    case "cancelled": return <Badge variant="destructive">{t("statusCancelled")}</Badge>;
    case "completed": return <Badge variant="outline">{t("statusCompleted")}</Badge>;
    case "no_show":   return <Badge variant="destructive">{t("statusNoShow")}</Badge>;
    default:          return <Badge variant="secondary">{status}</Badge>;
  }
}

function PaymentBadge({
  ps, due, paid, total, currency,
}: { ps: string; due: number; paid: number; total: number; currency: string }) {
  const t = useTranslations("admin.bookings");
  if (ps === "none") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (ps === "pending") {
    return (
      <div className="space-y-0.5">
        <Badge variant="secondary">{t("paymentAwaiting")}</Badge>
        <div className="text-xs text-muted-foreground">{t("paymentDue", { amount: formatPrice(due, currency) })}</div>
      </div>
    );
  }
  if (ps === "paid") {
    return (
      <div className="space-y-0.5">
        <Badge variant="success">{t("paymentPaid")}</Badge>
        <div className="text-xs text-muted-foreground">
          {formatPrice(paid || due, currency)}{paid && paid < total ? ` ${t("paymentOf", { total: formatPrice(total, currency) })}` : ""}
        </div>
      </div>
    );
  }
  if (ps === "refunded") {
    return (
      <div className="space-y-0.5">
        <Badge variant="outline">{t("paymentRefunded")}</Badge>
        <div className="text-xs text-muted-foreground">{formatPrice(paid || due, currency)}</div>
      </div>
    );
  }
  if (ps === "failed") {
    return <Badge variant="destructive">{t("paymentFailed")}</Badge>;
  }
  return <Badge variant="secondary">{ps}</Badge>;
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
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

export function BookingsTable({ bookings, currency }: { bookings: Booking[]; currency: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<Booking | null>(null);

  async function cancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
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
      body: JSON.stringify({ channels: ["email", "sms"] }),
    });
    setBusy(null);
    if (res.ok) {
      const data = await res.json();
      const msgs = Object.entries(data.results).map(([k, v]) => `${k}: ${v}`).join("\n");
      alert(`Reminder sent.\n\n${msgs}`);
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
      alert(j.error || "Refund failed");
    } else {
      setRefundTarget(null);
      router.refresh();
    }
  }

  if (bookings.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No bookings here.</p>;
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="border-b bg-secondary/30 text-xs uppercase text-muted-foreground tracking-wider">
          <tr>
            <th className="text-left px-4 py-3">When</th>
            <th className="text-left px-4 py-3">Customer</th>
            <th className="text-left px-4 py-3">Service / Staff</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Payment</th>
            <th className="text-right px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-secondary/20">
              <td className="px-4 py-3">
                <div className="font-medium">{format(new Date(b.startTime), "MMM d, yyyy")}</div>
                <div className="text-muted-foreground text-xs">{format(new Date(b.startTime), "h:mm a")}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{b.customerName}</div>
                <div className="text-muted-foreground text-xs">{b.customerEmail}</div>
                <div className="text-muted-foreground text-xs">{b.customerPhone}</div>
              </td>
              <td className="px-4 py-3">
                <div>{b.service.name}</div>
                {b.staff && <div className="text-xs text-muted-foreground">with {b.staff.name}</div>}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={b.status} />
              </td>
              <td className="px-4 py-3">
                <PaymentBadge ps={b.paymentStatus} due={b.amountDueCents} paid={b.amountPaidCents} total={b.priceCents} currency={currency} />
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {b.status === "confirmed" && new Date(b.startTime) > new Date() && (
                  <Button size="sm" variant="ghost" disabled={busy === b.id}
                    onClick={() => sendReminder(b.id)} title="Send reminder now">
                    <Bell className="w-3 h-3" /> Remind
                  </Button>
                )}
                {b.status === "confirmed" && new Date(b.startTime) < new Date() && (
                  <>
                    <Button size="sm" variant="ghost" disabled={busy === b.id}
                      onClick={() => setStatus(b.id, "completed")}
                      title="Mark as completed">
                      <Check className="w-3 h-3" /> Done
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy === b.id}
                      onClick={() => setStatus(b.id, "no_show", "Mark this as a no-show?")}
                      title="Mark as no-show">
                      <UserX className="w-3 h-3" /> No-show
                    </Button>
                  </>
                )}
                {b.paymentStatus === "paid" && (
                  <Button
                    size="sm" variant="ghost"
                    disabled={busy === b.id}
                    onClick={() => setRefundTarget(b)}
                    title="Refund this payment"
                  >
                    <RotateCcw className="w-3 h-3" /> Refund
                  </Button>
                )}
                {b.status !== "cancelled" && b.status !== "completed" && b.status !== "no_show" && (
                  <Button size="sm" variant="ghost" disabled={busy === b.id} onClick={() => cancel(b.id)}>
                    {busy === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    {busy === b.id ? "Working" : "Cancel"}
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
            <DialogTitle className="font-display text-xl">Refund this booking?</DialogTitle>
            <DialogDescription>
              The customer will be refunded {refundTarget && formatPrice(refundTarget.amountPaidCents || refundTarget.amountDueCents, currency)} via Stripe.
              This will also cancel the appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button onClick={refund} disabled={busy !== null} variant="destructive">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Refunding…</> : "Refund"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "confirmed": return <Badge variant="success">Confirmed</Badge>;
    case "pending":   return <Badge variant="secondary">Pending</Badge>;
    case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
    case "completed": return <Badge variant="outline">Completed</Badge>;
    case "no_show":   return <Badge variant="destructive">No-show</Badge>;
    default:          return <Badge variant="secondary">{status}</Badge>;
  }
}

function PaymentBadge({
  ps, due, paid, total, currency,
}: { ps: string; due: number; paid: number; total: number; currency: string }) {
  if (ps === "none") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (ps === "pending") {
    return (
      <div className="space-y-0.5">
        <Badge variant="secondary">Awaiting payment</Badge>
        <div className="text-xs text-muted-foreground">{formatPrice(due, currency)} due</div>
      </div>
    );
  }
  if (ps === "paid") {
    return (
      <div className="space-y-0.5">
        <Badge variant="success">Paid</Badge>
        <div className="text-xs text-muted-foreground">
          {formatPrice(paid || due, currency)}{paid && paid < total ? ` of ${formatPrice(total, currency)}` : ""}
        </div>
      </div>
    );
  }
  if (ps === "refunded") {
    return (
      <div className="space-y-0.5">
        <Badge variant="outline">Refunded</Badge>
        <div className="text-xs text-muted-foreground">{formatPrice(paid || due, currency)}</div>
      </div>
    );
  }
  if (ps === "failed") {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">{ps}</Badge>;
}

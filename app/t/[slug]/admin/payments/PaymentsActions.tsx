"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

export function PaymentsActions({ hasAccount, charges }: { hasAccount: boolean; charges: boolean }) {
  const [loading, setLoading] = useState<"onboard" | "dashboard" | null>(null);

  async function startOnboarding() {
    setLoading("onboard");
    const res = await fetch("/api/admin/payments/onboard", { method: "POST" });
    setLoading(null);
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed to start onboarding");
    }
  }

  async function openDashboard() {
    setLoading("dashboard");
    const res = await fetch("/api/admin/payments/dashboard", { method: "POST" });
    setLoading(null);
    if (res.ok) {
      const { url } = await res.json();
      window.open(url, "_blank");
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {!charges ? (
        <Button onClick={startOnboarding} disabled={loading === "onboard"}>
          {loading === "onboard" ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</> : hasAccount ? "Continue onboarding" : "Connect Stripe"}
        </Button>
      ) : (
        <>
          <Button variant="outline" onClick={openDashboard} disabled={loading === "dashboard"}>
            {loading === "dashboard" ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</> : <><ExternalLink className="w-3.5 h-3.5" /> Stripe dashboard</>}
          </Button>
          <Button variant="ghost" onClick={startOnboarding}>Edit account details</Button>
        </>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export function BillingActions() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  }

  return (
    <Button onClick={openPortal} disabled={loading}>
      <CreditCard className="w-4 h-4" /> {loading ? "Opening…" : "Open billing portal"}
    </Button>
  );
}

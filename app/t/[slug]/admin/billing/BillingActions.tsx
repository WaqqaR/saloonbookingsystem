"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

export function BillingActions() {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("admin.billing");

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
      <CreditCard className="w-4 h-4" /> {loading ? t("opening") : t("openPortal")}
    </Button>
  );
}

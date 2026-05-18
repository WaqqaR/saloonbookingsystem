"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Hours = { id: string; dayOfWeek: number; open: boolean; openTime: string; closeTime: string };

const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export function HoursEditor({ initial }: { initial: Hours[] }) {
  const t = useTranslations("admin.availability");
  const c = useTranslations("admin.common");
  const [hours, setHours] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(dow: number, patch: Partial<Hours>) {
    setHours(hours.map((h) => (h.dayOfWeek === dow ? { ...h, ...patch } : h)));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <div className="space-y-3">
      {hours.map((h) => (
        <div key={h.dayOfWeek} className="flex items-center gap-3">
          <div className="w-24 font-medium">{t(`days.${dayKeys[h.dayOfWeek]}`)}</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={h.open} onChange={(e) => update(h.dayOfWeek, { open: e.target.checked })} />
            {t("open")}
          </label>
          <Input className="w-28" type="time" value={h.openTime} onChange={(e) => update(h.dayOfWeek, { openTime: e.target.value })} disabled={!h.open} />
          <span className="text-muted-foreground">{t("to")}</span>
          <Input className="w-28" type="time" value={h.closeTime} onChange={(e) => update(h.dayOfWeek, { closeTime: e.target.value })} disabled={!h.open} />
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={saving}>{saving ? c("saving") : t("saveHours")}</Button>
        {saved && <span className="text-sm text-emerald-600">{c("saved")}</span>}
      </div>
    </div>
  );
}

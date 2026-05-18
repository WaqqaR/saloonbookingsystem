"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS_TYPES } from "@/lib/treatments";

type Settings = {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  currency: string;
  businessType: string;
  cancellationWindowHours: number;
  noShowFeePercent: number;
  emailRemindersEnabled: boolean;
  smsRemindersEnabled: boolean;
  reminderHoursBefore: number;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const t = useTranslations("admin.settings");
  const c = useTranslations("admin.common");
  const [s, setS] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); router.refresh(); }
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>{t("studioName")}</Label>
          <Input value={s.name} onChange={(e) => { setS({ ...s, name: e.target.value }); setSaved(false); }} />
        </div>
        <div>
          <Label>{t("contactEmail")}</Label>
          <Input type="email" value={s.email} onChange={(e) => { setS({ ...s, email: e.target.value }); setSaved(false); }} />
        </div>
        <div>
          <Label>{t("phoneOptional")}</Label>
          <Input value={s.phone} onChange={(e) => { setS({ ...s, phone: e.target.value }); setSaved(false); }} />
        </div>
        <div>
          <Label>{t("timezone")}</Label>
          <Input value={s.timezone} onChange={(e) => { setS({ ...s, timezone: e.target.value }); setSaved(false); }} placeholder="Europe/London" />
        </div>
        <div>
          <Label>{t("currency")}</Label>
          <Input value={s.currency} onChange={(e) => { setS({ ...s, currency: e.target.value.toUpperCase() }); setSaved(false); }} placeholder="GBP" />
        </div>
        <div className="sm:col-span-2">
          <Label>{t("businessType")}</Label>
          <select
            value={s.businessType}
            onChange={(e) => { setS({ ...s, businessType: e.target.value }); setSaved(false); }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">{c("selectPlaceholder")}</option>
            {BUSINESS_TYPES.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">{t("businessTypeHint")}</p>
        </div>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-display text-lg mb-1">{t("bookingPolicies")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("bookingPoliciesDesc")}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>{t("cancellationWindow")}</Label>
            <Input type="number" min={0} max={168} value={s.cancellationWindowHours}
              onChange={(e) => { setS({ ...s, cancellationWindowHours: Number(e.target.value) }); setSaved(false); }} />
            <p className="text-xs text-muted-foreground mt-1">{t("cancellationWindowHint")}</p>
          </div>
          <div>
            <Label>{t("noShowFee")}</Label>
            <Input type="number" min={0} max={100} value={s.noShowFeePercent}
              onChange={(e) => { setS({ ...s, noShowFeePercent: Number(e.target.value) }); setSaved(false); }} />
            <p className="text-xs text-muted-foreground mt-1">{t("noShowFeeHint")}</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-display text-lg mb-1">{t("reminders")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("remindersDesc")}</p>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:border-accent/50">
            <input type="checkbox" className="mt-0.5" checked={s.emailRemindersEnabled}
              onChange={(e) => { setS({ ...s, emailRemindersEnabled: e.target.checked }); setSaved(false); }} />
            <div>
              <div className="font-medium">{t("emailReminders")}</div>
              <div className="text-xs text-muted-foreground">{t("emailRemindersDesc")}</div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:border-accent/50">
            <input type="checkbox" className="mt-0.5" checked={s.smsRemindersEnabled}
              onChange={(e) => { setS({ ...s, smsRemindersEnabled: e.target.checked }); setSaved(false); }} />
            <div>
              <div className="font-medium">{t("smsReminders")}</div>
              <div className="text-xs text-muted-foreground">{t("smsRemindersDesc")}</div>
            </div>
          </label>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Label>{t("reminderHours")}</Label>
              <Input type="number" min={1} max={168} value={s.reminderHoursBefore}
                onChange={(e) => { setS({ ...s, reminderHoursBefore: Number(e.target.value) }); setSaved(false); }} />
              <p className="text-xs text-muted-foreground mt-1">{t("reminderHoursHint")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t pt-5">
        <Button onClick={save} disabled={saving}>{saving ? c("saving") : t("saveButton")}</Button>
        {saved && <span className="text-sm text-sage">{c("saved")}</span>}
      </div>
    </div>
  );
}

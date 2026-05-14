"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Settings = {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  currency: string;
  cancellationWindowHours: number;
  noShowFeePercent: number;
  emailRemindersEnabled: boolean;
  smsRemindersEnabled: boolean;
  reminderHoursBefore: number;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
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
          <Label>Studio name</Label>
          <Input value={s.name} onChange={(e) => { setS({ ...s, name: e.target.value }); setSaved(false); }} />
        </div>
        <div>
          <Label>Contact email</Label>
          <Input type="email" value={s.email} onChange={(e) => { setS({ ...s, email: e.target.value }); setSaved(false); }} />
        </div>
        <div>
          <Label>Phone (optional)</Label>
          <Input value={s.phone} onChange={(e) => { setS({ ...s, phone: e.target.value }); setSaved(false); }} />
        </div>
        <div>
          <Label>Timezone</Label>
          <Input value={s.timezone} onChange={(e) => { setS({ ...s, timezone: e.target.value }); setSaved(false); }} placeholder="Europe/London" />
        </div>
        <div>
          <Label>Currency</Label>
          <Input value={s.currency} onChange={(e) => { setS({ ...s, currency: e.target.value.toUpperCase() }); setSaved(false); }} placeholder="GBP" />
        </div>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-display text-lg mb-1">Booking policies</h3>
        <p className="text-sm text-muted-foreground mb-4">Set the rules customers see when booking.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Cancellation window (hours)</Label>
            <Input type="number" min={0} max={168} value={s.cancellationWindowHours}
              onChange={(e) => { setS({ ...s, cancellationWindowHours: Number(e.target.value) }); setSaved(false); }} />
            <p className="text-xs text-muted-foreground mt-1">Customers must cancel at least this many hours before their appointment.</p>
          </div>
          <div>
            <Label>No-show fee (% of price)</Label>
            <Input type="number" min={0} max={100} value={s.noShowFeePercent}
              onChange={(e) => { setS({ ...s, noShowFeePercent: Number(e.target.value) }); setSaved(false); }} />
            <p className="text-xs text-muted-foreground mt-1">Used when marking a booking as no-show. 100% = keep full deposit/payment.</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-display text-lg mb-1">Reminders</h3>
        <p className="text-sm text-muted-foreground mb-4">Automatic reminders before customers&apos; appointments.</p>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:border-accent/50">
            <input type="checkbox" className="mt-0.5" checked={s.emailRemindersEnabled}
              onChange={(e) => { setS({ ...s, emailRemindersEnabled: e.target.checked }); setSaved(false); }} />
            <div>
              <div className="font-medium">Email reminders</div>
              <div className="text-xs text-muted-foreground">Sent to the customer&apos;s email address. Free.</div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:border-accent/50">
            <input type="checkbox" className="mt-0.5" checked={s.smsRemindersEnabled}
              onChange={(e) => { setS({ ...s, smsRemindersEnabled: e.target.checked }); setSaved(false); }} />
            <div>
              <div className="font-medium">SMS reminders</div>
              <div className="text-xs text-muted-foreground">Sent via Twilio. Approx. £0.04 per message.</div>
            </div>
          </label>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Label>Send reminders how many hours before?</Label>
              <Input type="number" min={1} max={168} value={s.reminderHoursBefore}
                onChange={(e) => { setS({ ...s, reminderHoursBefore: Number(e.target.value) }); setSaved(false); }} />
              <p className="text-xs text-muted-foreground mt-1">Common values: 24 (day before), 2 (a couple hours before).</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t pt-5">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
        {saved && <span className="text-sm text-sage">Saved.</span>}
      </div>
    </div>
  );
}

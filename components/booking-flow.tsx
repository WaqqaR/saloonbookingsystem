"use client";
import { useEffect, useMemo, useState } from "react";
import { format, addDays, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronLeft, Clock, Calendar, Loader2, User } from "lucide-react";
import { cn, formatDuration, formatPrice } from "@/lib/utils";
import { formatInTenantTz } from "@/lib/datetime";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  category: string | null;
  paymentMode?: string;
  depositCents?: number;
};

type Staff = { id: string; name: string; bio: string | null; color: string | null };
type Slot = { start: string; label: string; staffId: string | null };
type Step = "service" | "staff" | "datetime" | "details" | "confirmation";

function groupByCategory(svcs: Service[]): Record<string, Service[]> {
  const out: Record<string, Service[]> = {};
  for (const s of svcs) {
    const k = s.category || "Other";
    (out[k] ||= []).push(s);
  }
  return out;
}

export function BookingFlow({
  embed = false,
  tenantSlug,
  currency = "GBP",
  locale = "en-GB",
  timezone = "Europe/London",
}: {
  embed?: boolean;
  tenantSlug: string;
  currency?: string;
  locale?: string;
  timezone?: string;
}) {
  const t = useTranslations("booking");
  const tz = { defaultLocale: locale, timezone };
  const apiBase = `/api/t/${tenantSlug}`;
  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [policy, setPolicy] = useState<{ cancellationWindowHours: number; noShowFeePercent: number } | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null); // null = any
  const [anyStaff, setAnyStaff] = useState(true);
  const [date, setDate] = useState<string>(format(startOfToday(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${apiBase}/services`).then((r) => r.json()),
      fetch(`${apiBase}/staff`).then((r) => r.json()),
    ]).then(([sv, st]) => {
      setServices(sv.services || []);
      setPolicy(sv.policy || null);
      setStaffList(st.staff || []);
    }).catch(() => setError(t("errorLoadShop")));
  }, [apiBase, t]);

  useEffect(() => {
    if (!service) return;
    setLoading(true);
    setSlot(null);
    const staffParam = anyStaff || !staff ? "" : `&staffId=${staff.id}`;
    fetch(`${apiBase}/availability?serviceId=${service.id}&date=${date}${staffParam}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .catch(() => setError(t("errorLoadAvailability")))
      .finally(() => setLoading(false));
  }, [service, staff, anyStaff, date, apiBase, t]);

  useEffect(() => {
    if (!embed || typeof window === "undefined") return;
    const prevMinH = document.body.style.minHeight;
    document.body.style.minHeight = "0";
    document.body.classList.remove("min-h-screen");
    const post = () => {
      try {
        window.parent.postMessage({ type: "salon-booking:resize", height: document.body.scrollHeight }, "*");
      } catch {}
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.body);
    return () => { ro.disconnect(); document.body.style.minHeight = prevMinH; };
  }, [embed, step, slots.length]);

  const upcomingDays = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: 14 }).map((_, i) => addDays(today, i));
  }, []);

  const hasStaffStep = staffList.length > 1;

  async function submit() {
    if (!service || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          staffId: anyStaff ? slot.staffId : staff?.id || null,
          startTime: slot.start,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errorBooking"));
      // If payment is required, send the customer to Stripe Checkout.
      if (data.checkoutUrl) {
        if (embed && window.top) {
          window.top.location.href = data.checkoutUrl;
        } else {
          window.location.href = data.checkoutUrl;
        }
        return;
      }
      setConfirmation(data.booking);
      setStep("confirmation");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const steps: Step[] = hasStaffStep ? ["service", "staff", "datetime", "details", "confirmation"] : ["service", "datetime", "details", "confirmation"];
  const stepIndex = steps.indexOf(step);
  const labels = hasStaffStep
    ? [t("stepLabelService"), t("stepLabelStaff"), t("stepLabelDateTime"), t("stepLabelDetails"), t("stepLabelDone")]
    : [t("stepLabelService"), t("stepLabelDateTime"), t("stepLabelDetails"), t("stepLabelDone")];

  return (
    <div className={cn("w-full", !embed && "max-w-3xl mx-auto px-4 py-8")}>
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn("h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold", i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted")}>
              {i < stepIndex ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={cn(i === stepIndex && "text-foreground font-medium")}>{label}</span>
            {i < labels.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 border border-destructive/50 bg-destructive/10 text-destructive text-sm rounded">{error}</div>
      )}

      {step === "service" && (
        <div>
          <h2 className="font-display text-3xl font-light mb-6">{t("chooseTreatment")}</h2>
          {Object.entries(groupByCategory(services)).map(([cat, items]) => (
            <div key={cat} className="mb-8">
              <div className="eyebrow mb-3">{cat}</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setService(s); setStep(hasStaffStep ? "staff" : "datetime"); }}
                    className="text-left p-4 border border-border/60 bg-card rounded-md hover:border-accent/50 hover:shadow-sm transition"
                  >
                    <div className="font-display text-lg mb-1">{s.name}</div>
                    {s.description && <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{s.description}</p>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDuration(s.durationMinutes)}</span>
                      <span className="font-display text-lg font-medium text-primary">{formatPrice(s.priceCents, currency)}</span>
                    </div>
                    {s.paymentMode === "deposit" && (
                      <p className="text-[11px] uppercase tracking-[0.2em] text-accent mt-2">
                        {t("depositAtBooking", { amount: formatPrice(s.depositCents || 0, currency) })}
                      </p>
                    )}
                    {s.paymentMode === "full" && (
                      <p className="text-[11px] uppercase tracking-[0.2em] text-accent mt-2">{t("payableAtBooking")}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === "staff" && service && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setStep("service")} className="mb-4"><ChevronLeft className="w-4 h-4" /> {t("back")}</Button>
          <h2 className="text-2xl font-semibold mb-4">{t("stepStaff")}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={() => { setAnyStaff(true); setStaff(null); setStep("datetime"); }} className="text-left p-4 border rounded-lg hover:border-primary hover:shadow-sm transition">
              <div className="font-medium flex items-center gap-2"><User className="w-4 h-4" /> {t("anyAvailable")}</div>
              <p className="text-sm text-muted-foreground">{t("anyAvailableHint")}</p>
            </button>
            {staffList.map((s) => (
              <button key={s.id} onClick={() => { setStaff(s); setAnyStaff(false); setStep("datetime"); }} className="text-left p-4 border rounded-lg hover:border-primary hover:shadow-sm transition">
                <div className="font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: s.color || "#888" }} /> {s.name}
                </div>
                {s.bio && <p className="text-sm text-muted-foreground">{s.bio}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "datetime" && service && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setStep(hasStaffStep ? "staff" : "service")} className="mb-4"><ChevronLeft className="w-4 h-4" /> {t("back")}</Button>
          <h2 className="text-2xl font-semibold mb-1">{t("stepDateTime")}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {service.name} · {formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents, currency)}
            {staff && t("withStaff", { name: staff.name })}
            {anyStaff && hasStaffStep && t("anyStaff")}
          </p>

          <div className="mb-6">
            <Label className="mb-2 block">{t("dateLabel")}</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {upcomingDays.map((d) => {
                const iso = format(d, "yyyy-MM-dd");
                const isSelected = iso === date;
                return (
                  <button key={iso} onClick={() => setDate(iso)} className={cn("shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-lg border", isSelected ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground")}>
                    <span className="text-xs uppercase">{formatInTenantTz(d, tz, "weekdayShort")}</span>
                    <span className="text-xl font-semibold">{formatInTenantTz(d, tz, "dayNum")}</span>
                    <span className="text-[10px] uppercase">{formatInTenantTz(d, tz, "monthShort")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">{t("availableTimes")}</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> {t("loadingSlots")}</div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noSlots")}</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button key={s.start} onClick={() => setSlot(s)} className={cn("p-2 text-sm border rounded-md hover:border-primary", slot?.start === s.start && "border-primary bg-primary text-primary-foreground")}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button disabled={!slot} onClick={() => setStep("details")}>{t("continue")}</Button>
          </div>
        </div>
      )}

      {step === "details" && service && slot && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setStep("datetime")} className="mb-4"><ChevronLeft className="w-4 h-4" /> {t("back")}</Button>
          <h2 className="text-2xl font-semibold mb-4">{t("stepDetails")}</h2>
          <div className="space-y-4 max-w-md">
            <div><Label htmlFor="name">{t("nameLabel")}</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("namePlaceholder")} /></div>
            <div><Label htmlFor="email">{t("emailLabel")}</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("emailPlaceholder")} /></div>
            <div><Label htmlFor="phone">{t("phoneLabel")}</Label><Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("phonePlaceholder")} /></div>
            <div><Label htmlFor="notes">{t("notesLabel")}</Label><Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("notesPlaceholder")} /></div>
          </div>

          <Card className="mt-6 bg-muted/30">
            <CardHeader><CardTitle className="text-base">{t("summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div><span className="text-muted-foreground">{t("summaryService")}:</span> {service.name}</div>
              {staff && <div><span className="text-muted-foreground">{t("summaryStaff")}:</span> {staff.name}</div>}
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" /> {formatInTenantTz(slot.start, tz, "dateLong")} {t("atTime", { time: slot.label })}</div>
              <div><span className="text-muted-foreground">{t("summaryDuration")}:</span> {formatDuration(service.durationMinutes)}</div>
              <div><span className="text-muted-foreground">{t("summaryTotal")}:</span> <span className="font-semibold">{formatPrice(service.priceCents, currency)}</span></div>
            </CardContent>
          </Card>

          {policy && (
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              {t("policy", { hours: policy.cancellationWindowHours })}
              {policy.noShowFeePercent > 0 && ` ${t("policyNoShow")}`}
            </p>
          )}
          <div className="mt-6 flex justify-end">
            <Button onClick={submit} disabled={submitting || !form.name || !form.email || !form.phone}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("booking")}</> : t("confirmBooking")}
            </Button>
          </div>
        </div>
      )}

      {step === "confirmation" && confirmation && (
        <Card className="border-sage/40">
          <CardHeader>
            <div className="mb-2 mx-auto h-12 w-12 rounded-full bg-sage/15 grid place-items-center"><Check className="w-6 h-6 text-sage" /></div>
            <CardTitle className="font-display text-2xl text-center">{t("confirmationTitle")}</CardTitle>
            <CardDescription className="text-center">{t("confirmationDescription", { email: confirmation.customerEmail })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">{t("summaryService")}:</span> {confirmation.service.name}</div>
            {confirmation.staff && <div><span className="text-muted-foreground">{t("summaryStaff")}:</span> {confirmation.staff.name}</div>}
            <div><span className="text-muted-foreground">{t("whenLabel")}:</span> {formatInTenantTz(confirmation.startTime, tz, "full")}</div>
            <div><span className="text-muted-foreground">{t("summaryTotal")}:</span> {formatPrice(confirmation.priceCents, currency)}</div>
            <div><span className="text-muted-foreground">{t("confirmationNumber")}:</span> {confirmation.id.slice(-8).toUpperCase()}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

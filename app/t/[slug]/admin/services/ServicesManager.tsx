"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";
import { TREATMENT_SUGGESTIONS, type BusinessType, type TreatmentSuggestion } from "@/lib/treatments";

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  category: string | null;
  active: boolean;
  sortOrder: number;
  paymentMode: string;
  depositCents: number;
};

const empty: Partial<Service> = { name: "", description: "", durationMinutes: 30, priceCents: 2500, category: "", active: true, paymentMode: "none", depositCents: 0 };

function currencySymbolOf(code: string) {
  if (code === "GBP") return "£";
  if (code === "EUR") return "€";
  if (code === "USD") return "$";
  return code;
}

export function ServicesManager({ initial, currency, businessType }: { initial: Service[]; currency: string; businessType: string | null }) {
  const t = useTranslations("admin.services");
  const c = useTranslations("admin.common");
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const [open, setOpen] = useState(false);
  const [priceText, setPriceText] = useState("");
  const [depositText, setDepositText] = useState("");
  const router = useRouter();
  const currencySymbol = currencySymbolOf(currency);

  // Sync display text from priceCents when editing is replaced (open dialog,
  // suggestion picked, etc). Skip when the current text already matches so we
  // don't clobber the user's in-progress typing (e.g. "2.5" stays "2.5", not "2.50").
  useEffect(() => {
    if (!editing) return;
    const target = editing.priceCents ? (editing.priceCents / 100).toFixed(2) : "";
    const parsed = parseFloat(priceText);
    const currentCents = isNaN(parsed) ? 0 : Math.round(parsed * 100);
    if (currentCents !== (editing.priceCents || 0)) setPriceText(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.priceCents]);

  useEffect(() => {
    if (!editing) return;
    const target = editing.depositCents ? (editing.depositCents / 100).toFixed(2) : "";
    const parsed = parseFloat(depositText);
    const currentCents = isNaN(parsed) ? 0 : Math.round(parsed * 100);
    if (currentCents !== (editing.depositCents || 0)) setDepositText(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.depositCents]);

  const suggestions: TreatmentSuggestion[] =
    businessType && businessType in TREATMENT_SUGGESTIONS
      ? TREATMENT_SUGGESTIONS[businessType as BusinessType]
      : [];
  const existingNames = new Set(items.map((s) => s.name.toLowerCase()));
  const unusedSuggestions = suggestions.filter((s) => !existingNames.has(s.name.toLowerCase()));

  const [nameFocused, setNameFocused] = useState(false);

  function applySuggestion(t: TreatmentSuggestion) {
    setEditing({
      ...empty,
      name: t.name,
      description: t.description,
      durationMinutes: t.durationMinutes,
      priceCents: t.priceCents,
      category: t.category,
    });
  }

  function fillFromSuggestion(t: TreatmentSuggestion) {
    setEditing((cur) => ({
      ...(cur ?? empty),
      name: t.name,
      description: t.description,
      durationMinutes: t.durationMinutes,
      priceCents: t.priceCents,
      category: t.category,
    }));
    setNameFocused(false);
  }

  const matchingSuggestions = (() => {
    if (!nameFocused || editing?.id || suggestions.length === 0) return [];
    const q = (editing?.name || "").toLowerCase().trim();
    if (!q) return [];
    return suggestions.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 6);
  })();

  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    const body = { ...editing, priceCents: Number(editing.priceCents), durationMinutes: Number(editing.durationMinutes) };
    const res = await fetch(isNew ? "/api/admin/services" : `/api/admin/services/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { service } = await res.json();
      if (isNew) setItems([...items, service]);
      else setItems(items.map((s) => (s.id === service.id ? service : s)));
      setOpen(false); setEditing(null); router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div>
      {unusedSuggestions.length > 0 && (
        <div className="mb-5 p-4 bg-accent/5 border border-accent/20 rounded-md">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-accent" />
            {t("suggestedTreatments")}
          </div>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => { applySuggestion(t); setOpen(true); }}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-accent hover:bg-accent/10 transition-colors"
              >
                {t.name}
                <span className="text-muted-foreground ms-2">
                  {formatDuration(t.durationMinutes)} · {formatPrice(t.priceCents, currency)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {!businessType && (
        <p className="mb-4 text-xs text-muted-foreground">
          {t.rich("setBusinessTypeHint", {
            settings: (chunks) => (
              <a className="underline" href="../settings">{chunks}</a>
            ),
          })}
        </p>
      )}
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setPriceText(""); setDepositText(""); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}><Plus className="w-4 h-4" /> {t("addService")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? t("editService") : t("newService")}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="relative">
                  <Label>{t("nameLabel")}</Label>
                  <Input
                    value={editing.name || ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setTimeout(() => setNameFocused(false), 150)}
                    autoComplete="off"
                  />
                  {matchingSuggestions.length > 0 && (
                    <div className="absolute z-50 start-0 end-0 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-card shadow-lg">
                      {matchingSuggestions.map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); fillFromSuggestion(t); }}
                          className="w-full text-start px-3 py-2 hover:bg-accent/10 border-b last:border-b-0 border-border/40"
                        >
                          <div className="text-sm font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{formatDuration(t.durationMinutes)} · {formatPrice(t.priceCents, currency)} · {t.category}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div><Label>{t("descriptionLabel")}</Label><Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>{t("durationLabel")}</Label><Input type="number" value={editing.durationMinutes || 0} onChange={(e) => setEditing({ ...editing, durationMinutes: Number(e.target.value) })} /></div>
                  <div>
                    <Label>{t("priceLabel")}</Label>
                    <div className="relative">
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">{currencySymbol}</span>
                      <Input
                        className="ps-7"
                        inputMode="decimal"
                        value={priceText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPriceText(v);
                          const pounds = parseFloat(v);
                          setEditing({ ...editing, priceCents: !isNaN(pounds) && pounds >= 0 ? Math.round(pounds * 100) : 0 });
                        }}
                        onBlur={() => {
                          const pounds = parseFloat(priceText);
                          if (!isNaN(pounds) && pounds >= 0) setPriceText(pounds.toFixed(2));
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div><Label>{t("categoryLabel")}</Label><Input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                </div>
                <div className="border-t pt-3">
                  <Label className="block mb-2">{t("paymentAtBooking")}</Label>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {[
                      { value: "none", label: t("paymentModeNone") },
                      { value: "deposit", label: t("paymentModeDeposit") },
                      { value: "full", label: t("paymentModeFull") },
                    ].map((opt) => (
                      <label key={opt.value} className={`p-2 border rounded cursor-pointer text-center ${editing.paymentMode === opt.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                        <input type="radio" name="paymentMode" value={opt.value} checked={editing.paymentMode === opt.value} onChange={() => setEditing({ ...editing, paymentMode: opt.value })} className="sr-only" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {editing.paymentMode === "deposit" && (
                    <div className="mt-3">
                      <Label>{t("depositAmount")}</Label>
                      <div className="relative">
                        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">{currencySymbol}</span>
                        <Input
                          className="ps-7"
                          inputMode="decimal"
                          value={depositText}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDepositText(v);
                            const pounds = parseFloat(v);
                            setEditing({ ...editing, depositCents: !isNaN(pounds) && pounds >= 0 ? Math.round(pounds * 100) : 0 });
                          }}
                          onBlur={() => {
                            const pounds = parseFloat(depositText);
                            if (!isNaN(pounds) && pounds >= 0) setDepositText(pounds.toFixed(2));
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{t("stripeConnectNote")}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                  {t("activeLabel")}
                </label>
                <div className="flex justify-end"><Button onClick={save}>{c("save")}</Button></div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <table className="w-full text-sm">
        <thead className="text-start text-xs uppercase text-muted-foreground border-b">
          <tr><th className="p-2">{t("colName")}</th><th className="p-2">{t("colDuration")}</th><th className="p-2">{t("colPrice")}</th><th className="p-2">{t("colCategory")}</th><th className="p-2">{t("colStatus")}</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {items.map((s) => (
            <tr key={s.id}>
              <td className="p-2 font-medium">{s.name}</td>
              <td className="p-2">{formatDuration(s.durationMinutes)}</td>
              <td className="p-2">{formatPrice(s.priceCents, currency)}</td>
              <td className="p-2">{s.category}</td>
              <td className="p-2"><Badge variant={s.active ? "success" : "secondary"}>{s.active ? t("statusActive") : t("statusHidden")}</Badge></td>
              <td className="p-2 text-end">
                <Button size="sm" variant="ghost" aria-label={c("edit")} onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" aria-label={c("delete")} onClick={() => remove(s.id)}><Trash2 className="w-3 h-3" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

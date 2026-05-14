"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function ServicesManager({ initial, currency, businessType }: { initial: Service[]; currency: string; businessType: string | null }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const suggestions: TreatmentSuggestion[] =
    businessType && businessType in TREATMENT_SUGGESTIONS
      ? TREATMENT_SUGGESTIONS[businessType as BusinessType]
      : [];
  const existingNames = new Set(items.map((s) => s.name.toLowerCase()));
  const unusedSuggestions = suggestions.filter((s) => !existingNames.has(s.name.toLowerCase()));

  function applySuggestion(t: TreatmentSuggestion) {
    setEditing({ ...empty, name: t.name, durationMinutes: t.durationMinutes, priceCents: t.priceCents, category: t.category });
  }

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
    if (!confirm("Delete this service?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div>
      {unusedSuggestions.length > 0 && (
        <div className="mb-5 p-4 bg-accent/5 border border-accent/20 rounded-md">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-accent" />
            Suggested treatments — click to add
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
                <span className="text-muted-foreground ml-2">
                  {formatDuration(t.durationMinutes)} · {formatPrice(t.priceCents, currency)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {!businessType && (
        <p className="mb-4 text-xs text-muted-foreground">
          Set your business type in <a className="underline" href="../settings">Settings</a> to get treatment suggestions.
        </p>
      )}
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}><Plus className="w-4 h-4" /> Add service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit service" : "New service"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Duration (min)</Label><Input type="number" value={editing.durationMinutes || 0} onChange={(e) => setEditing({ ...editing, durationMinutes: Number(e.target.value) })} /></div>
                  <div><Label>Price (pence)</Label><Input type="number" value={editing.priceCents || 0} onChange={(e) => setEditing({ ...editing, priceCents: Number(e.target.value) })} /></div>
                  <div><Label>Category</Label><Input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                </div>
                <div className="border-t pt-3">
                  <Label className="block mb-2">Payment at booking</Label>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {[
                      { value: "none", label: "None" },
                      { value: "deposit", label: "Deposit" },
                      { value: "full", label: "Full" },
                    ].map((opt) => (
                      <label key={opt.value} className={`p-2 border rounded cursor-pointer text-center ${editing.paymentMode === opt.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                        <input type="radio" name="paymentMode" value={opt.value} checked={editing.paymentMode === opt.value} onChange={() => setEditing({ ...editing, paymentMode: opt.value })} className="sr-only" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {editing.paymentMode === "deposit" && (
                    <div className="mt-3">
                      <Label>Deposit amount (pence)</Label>
                      <Input type="number" value={editing.depositCents || 0} onChange={(e) => setEditing({ ...editing, depositCents: Number(e.target.value) })} placeholder="e.g. 1000 for £10" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Requires Stripe Connect to be set up.</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                  Active (visible to customers)
                </label>
                <div className="flex justify-end"><Button onClick={save}>Save</Button></div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground border-b">
          <tr><th className="p-2">Name</th><th className="p-2">Duration</th><th className="p-2">Price</th><th className="p-2">Category</th><th className="p-2">Status</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {items.map((s) => (
            <tr key={s.id}>
              <td className="p-2 font-medium">{s.name}</td>
              <td className="p-2">{formatDuration(s.durationMinutes)}</td>
              <td className="p-2">{formatPrice(s.priceCents, currency)}</td>
              <td className="p-2">{s.category}</td>
              <td className="p-2"><Badge variant={s.active ? "success" : "secondary"}>{s.active ? "Active" : "Hidden"}</Badge></td>
              <td className="p-2 text-right">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="w-3 h-3" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stock: number;
  category: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
};

const empty: Partial<Product> = { name: "", description: "", priceCents: 1000, stock: 0, category: "", active: true };

export function ProductsManager({ initial, currency }: { initial: Product[]; currency: string }) {
  const t = useTranslations("admin.products");
  const c = useTranslations("admin.common");
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    const body = { ...editing, priceCents: Number(editing.priceCents), stock: Number(editing.stock) };
    const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { product } = await res.json();
      if (isNew) setItems([...items, product]);
      else setItems(items.map((p) => (p.id === product.id ? product : p)));
      setOpen(false); setEditing(null); router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}><Plus className="w-4 h-4" /> {t("addProduct")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? t("editProduct") : t("newProduct")}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>{t("fieldName")}</Label><Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>{t("fieldDescription")}</Label><Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>{t("fieldPricePence")}</Label><Input type="number" value={editing.priceCents || 0} onChange={(e) => setEditing({ ...editing, priceCents: Number(e.target.value) })} /></div>
                  <div><Label>{t("fieldStock")}</Label><Input type="number" value={editing.stock || 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></div>
                  <div><Label>{t("fieldCategory")}</Label><Input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
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
          <tr><th className="p-2">{t("colName")}</th><th className="p-2">{t("colPrice")}</th><th className="p-2">{t("colStock")}</th><th className="p-2">{t("colCategory")}</th><th className="p-2">{t("colStatus")}</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {items.map((p) => (
            <tr key={p.id}>
              <td className="p-2 font-medium">{p.name}</td>
              <td className="p-2">{formatPrice(p.priceCents, currency)}</td>
              <td className="p-2">{p.stock}</td>
              <td className="p-2">{p.category}</td>
              <td className="p-2"><Badge variant={p.active ? "success" : "secondary"}>{p.active ? t("statusActive") : t("statusHidden")}</Badge></td>
              <td className="p-2 text-end">
                <Button size="sm" variant="ghost" title={c("edit")} onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" title={c("delete")} onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

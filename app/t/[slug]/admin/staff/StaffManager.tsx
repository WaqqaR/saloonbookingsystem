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
import { Plus, Pencil, Trash2, Clock } from "lucide-react";

type Staff = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  color: string | null;
  active: boolean;
  sortOrder: number;
  workingHours: { id: string; dayOfWeek: number; open: boolean; openTime: string; closeTime: string }[];
};

const empty: Partial<Staff> = { name: "", email: "", phone: "", bio: "", color: "#888888", active: true };

export function StaffManager({ initial }: { initial: Staff[] }) {
  const t = useTranslations("admin.staff");
  const c = useTranslations("admin.common");
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Partial<Staff> | null>(null);
  const [hoursFor, setHoursFor] = useState<Staff | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    const res = await fetch(isNew ? "/api/admin/staff" : `/api/admin/staff/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      const { staff } = await res.json();
      if (isNew) setItems([...items, staff]);
      else setItems(items.map((s) => (s.id === staff.id ? staff : s)));
      setOpen(false); setEditing(null); router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm(t("removeConfirm"))) return;
    const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter((i) => i.id !== id));
    router.refresh();
  }

  async function saveHours(staffId: string, hours: any[]) {
    await fetch(`/api/admin/staff/${staffId}/hours`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}><Plus className="w-4 h-4" /> {t("addStaff")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? t("editStaff") : t("newStaff")}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div><Label>{t("fieldName")}</Label><Input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("fieldEmail")}</Label><Input type="email" value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
                  <div><Label>{t("fieldPhone")}</Label><Input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
                </div>
                <div><Label>{t("fieldBio")}</Label><Textarea value={editing.bio || ""} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></div>
                <div><Label>{t("fieldCalendarColor")}</Label><Input type="color" value={editing.color || "#888888"} onChange={(e) => setEditing({ ...editing, color: e.target.value })} className="w-16 h-10 p-1" /></div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                  {t("activeBilledSeat")}
                </label>
                <div className="flex justify-end"><Button onClick={save}>{c("save")}</Button></div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <table className="w-full text-sm">
        <thead className="text-start text-xs uppercase text-muted-foreground border-b">
          <tr><th className="p-2">{t("fieldName")}</th><th className="p-2">{t("fieldEmail")}</th><th className="p-2">{t("colStatus")}</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {items.map((s) => (
            <tr key={s.id}>
              <td className="p-2 font-medium flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: s.color || "#888" }} />{s.name}</td>
              <td className="p-2 text-muted-foreground">{s.email}</td>
              <td className="p-2"><Badge variant={s.active ? "success" : "secondary"}>{s.active ? t("statusActive") : t("statusInactive")}</Badge></td>
              <td className="p-2 text-end">
                <Button size="sm" variant="ghost" title={t("editHours")} onClick={() => setHoursFor(s)}><Clock className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" title={c("edit")} onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" title={c("remove")} onClick={() => remove(s.id)}><Trash2 className="w-3 h-3" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={!!hoursFor} onOpenChange={(o) => !o && setHoursFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("hoursTitle", { name: hoursFor?.name ?? "" })}</DialogTitle></DialogHeader>
          {hoursFor && <StaffHoursEditor staff={hoursFor} onSave={(h) => { saveHours(hoursFor.id, h); setHoursFor(null); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StaffHoursEditor({ staff, onSave }: { staff: Staff; onSave: (hours: any[]) => void }) {
  const t = useTranslations("admin.staff");
  const c = useTranslations("admin.common");
  const dayNames = [t("daySun"), t("dayMon"), t("dayTue"), t("dayWed"), t("dayThu"), t("dayFri"), t("daySat")];
  const init = staff.workingHours.length > 0 ? staff.workingHours :
    [0,1,2,3,4,5,6].map((d) => ({ id: "", dayOfWeek: d, open: d !== 0, openTime: "09:00", closeTime: "18:00" }));
  const [hours, setHours] = useState(init);

  return (
    <div className="space-y-2">
      {[0,1,2,3,4,5,6].map((d) => {
        const h = hours.find((x) => x.dayOfWeek === d) || { id: "", dayOfWeek: d, open: false, openTime: "09:00", closeTime: "18:00" };
        return (
          <div key={d} className="flex items-center gap-3">
            <div className="w-12 text-sm font-medium">{dayNames[d]}</div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={h.open} onChange={(e) => setHours(replace(hours, d, { ...h, open: e.target.checked }))} />
              {t("working")}
            </label>
            <Input className="w-28" type="time" value={h.openTime} onChange={(e) => setHours(replace(hours, d, { ...h, openTime: e.target.value }))} disabled={!h.open} />
            <span className="text-muted-foreground">{t("timeRangeTo")}</span>
            <Input className="w-28" type="time" value={h.closeTime} onChange={(e) => setHours(replace(hours, d, { ...h, closeTime: e.target.value }))} disabled={!h.open} />
          </div>
        );
      })}
      <div className="flex justify-end"><Button onClick={() => onSave(hours)}>{c("save")}</Button></div>
    </div>
  );
}

function replace<T extends { dayOfWeek: number }>(arr: T[], dow: number, item: T): T[] {
  const idx = arr.findIndex((x) => x.dayOfWeek === dow);
  if (idx === -1) return [...arr, item];
  const next = arr.slice();
  next[idx] = item;
  return next;
}

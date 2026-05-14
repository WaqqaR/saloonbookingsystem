"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CustomerNotes({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setSaved(true);
  }
  return (
    <div className="space-y-2">
      <Textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false); }} rows={4} placeholder="Preferred style, allergies, anything to remember…" />
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} size="sm">{saving ? "Saving…" : "Save"}</Button>
        {saved && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
    </div>
  );
}

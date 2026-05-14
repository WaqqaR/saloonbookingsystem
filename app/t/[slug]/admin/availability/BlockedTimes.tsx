"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

type Block = { id: string; startTime: string | Date; endTime: string | Date; reason: string | null };

export function BlockedTimes({ initial }: { initial: Block[] }) {
  const [items, setItems] = useState(initial);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const router = useRouter();

  async function add() {
    if (!startTime || !endTime) return;
    const res = await fetch("/api/admin/blocked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime, endTime, reason }),
    });
    if (res.ok) {
      const { block } = await res.json();
      setItems([...items, block]);
      setStartTime(""); setEndTime(""); setReason(""); router.refresh();
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/blocked/${id}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-4 gap-3 items-end">
        <div><Label>From</Label><Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
        <div><Label>To</Label><Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
        <div><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Holiday" /></div>
        <Button onClick={add}>Add block</Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No blocked times.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground border-b">
            <tr><th className="p-2">Start</th><th className="p-2">End</th><th className="p-2">Reason</th><th></th></tr>
          </thead>
          <tbody className="divide-y">
            {items.map((b) => (
              <tr key={b.id}>
                <td className="p-2">{format(new Date(b.startTime), "MMM d, yyyy h:mm a")}</td>
                <td className="p-2">{format(new Date(b.endTime), "MMM d, yyyy h:mm a")}</td>
                <td className="p-2">{b.reason}</td>
                <td className="p-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="w-3 h-3" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

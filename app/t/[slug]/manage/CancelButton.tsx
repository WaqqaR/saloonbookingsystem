"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function CancelButton({ slug, token }: { slug: string; token: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/t/${encodeURIComponent(slug)}/manage/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Could not cancel.");
      setBusy(false);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="destructive" className="w-full" onClick={() => setOpen(true)}>
        Cancel this appointment
      </Button>
      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Cancel appointment?</DialogTitle>
            <DialogDescription>
              You can re-book any time. If you paid in advance, the shop will refund you separately.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Keep it</Button>
            <Button variant="destructive" onClick={confirm} disabled={busy}>
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling…</> : "Yes, cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

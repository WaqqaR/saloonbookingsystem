"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Loader2, X } from "lucide-react";
import { Wordmark } from "@/components/wordmark";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export default function SignupPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseDomain, setBaseDomain] = useState("yoursaas.com");
  useEffect(() => {
    if (typeof window !== "undefined") setBaseDomain(window.location.host);
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(shopName));
  }, [shopName, slugTouched]);

  useEffect(() => {
    if (!slug) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      const r = await fetch(`/api/signup/check-slug?slug=${encodeURIComponent(slug)}`);
      const j = await r.json();
      setSlugStatus(j.ok ? "ok" : j.reason || "taken");
    }, 250);
    return () => clearTimeout(t);
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopName, slug, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Signup failed"); return; }
    // If Stripe is enabled, hop to Checkout. Otherwise straight to the new admin.
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else window.location.href = data.adminUrl;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Wordmark size="md" /></Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Already have an account? <span className="text-foreground underline">Sign in</span></Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">begin</p>
          <h1 className="font-display text-5xl font-light tracking-tight">
            Start your <em className="italic text-accent">free trial</em>
          </h1>
          <p className="text-sm text-muted-foreground mt-4">14 days. No card required.</p>
        </div>

        <Card className="bg-card border-border/60 shadow-sm overflow-hidden">
          <div className="gold-rule" />
          <CardHeader className="pt-7">
            <CardTitle className="font-display text-2xl font-medium">Your studio</CardTitle>
            <CardDescription>Set up in under two minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Shop name</Label>
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Acme Cuts" required autoFocus />
              </div>
              <div>
                <Label>Your booking URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
                    required
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">.{baseDomain}</span>
                </div>
                <SlugFeedback status={slugStatus} slug={slug} baseDomain={baseDomain} />
              </div>
              <div>
                <Label>Your email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || slugStatus !== "ok" || !email || password.length < 8}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating shop…</> : "Create my shop"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">By signing up you agree to the terms of service.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SlugFeedback({ status, slug, baseDomain }: { status: string; slug: string; baseDomain: string }) {
  if (!slug) return null;
  if (status === "checking") return <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking…</p>;
  if (status === "ok") return <p className="text-xs text-sage mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Available — your URL will be {slug}.{baseDomain}</p>;
  if (status === "taken") return <p className="text-xs text-destructive mt-1 flex items-center gap-1"><X className="w-3 h-3" /> Already taken — try another.</p>;
  if (status === "invalid") return <p className="text-xs text-destructive mt-1 flex items-center gap-1"><X className="w-3 h-3" /> Use letters, numbers, and hyphens only (3-32 chars).</p>;
  if (status === "reserved") return <p className="text-xs text-destructive mt-1 flex items-center gap-1"><X className="w-3 h-3" /> This name is reserved — try another.</p>;
  return null;
}

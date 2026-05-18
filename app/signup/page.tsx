"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Loader2, X, Pencil } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/treatments";
import { LOCALES, CURRENCIES, COMMON_TIMEZONES, currencyForLocale, isValidTimezone, regionSummary } from "@/lib/locales";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export default function SignupPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>("barbershop");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseDomain, setBaseDomain] = useState("yoursaas.com");
  const [locale, setLocale] = useState("en-GB");
  const [timezone, setTimezone] = useState("Europe/London");
  const [currency, setCurrency] = useState("GBP");
  const [regionOpen, setRegionOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setBaseDomain(window.location.host);
  }, []);

  // Best-effort detection from the browser; owner can correct it below.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && isValidTimezone(tz)) setTimezone(tz);
    } catch {}
    const nav = navigator.language;
    if (nav && /^[a-z]{2}-[A-Z]{2}$/.test(nav)) {
      setLocale(nav);
      setCurrency(currencyForLocale(nav));
    }
  }, []);

  const localeOptions = LOCALES.some((l) => l.value === locale)
    ? LOCALES
    : [{ value: locale, label: locale }, ...LOCALES];
  const tzOptions = COMMON_TIMEZONES.includes(timezone)
    ? COMMON_TIMEZONES
    : [timezone, ...COMMON_TIMEZONES];
  const currencyOptions = CURRENCIES.some((c) => c.value === currency)
    ? CURRENCIES
    : [{ value: currency, label: currency }, ...CURRENCIES];

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
      body: JSON.stringify({ shopName, slug, businessType, email, password, locale, timezone, currency }),
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
                <Label>What kind of business?</Label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className={SELECT_CLASS}
                >
                  {BUSINESS_TYPES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">We'll suggest common treatments based on this.</p>
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
                <div className="flex items-center justify-between">
                  <Label>Region {!regionOpen && <span className="text-muted-foreground font-normal">(detected)</span>}</Label>
                  {!regionOpen && (
                    <button
                      type="button"
                      onClick={() => setRegionOpen(true)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> change
                    </button>
                  )}
                </div>
                {!regionOpen ? (
                  <div className={SELECT_CLASS + " items-center text-muted-foreground cursor-default"}>
                    {regionSummary(locale, timezone, currency)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Language</span>
                      <select value={locale} onChange={(e) => setLocale(e.target.value)} className={SELECT_CLASS}>
                        {localeOptions.map((l) => (
                          <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Timezone</span>
                      <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={SELECT_CLASS}>
                        {tzOptions.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Currency</span>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={SELECT_CLASS}>
                        {currencyOptions.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Sets your booking page language, times, and prices. You can change this later in settings.</p>
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

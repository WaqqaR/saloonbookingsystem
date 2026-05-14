import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wordmark } from "@/components/wordmark";
import {
  Calendar,
  CreditCard,
  Globe,
  Users,
  Bell,
  Code,
} from "lucide-react";

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Wordmark size="md" /></Link>
          <nav className="flex items-center gap-1">
            <Link href="/pricing"><Button variant="ghost">Pricing</Button></Link>
            <Link href="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link href="/signup"><Button>Start free trial</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden warm-vignette">
        <div className="max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
          <p className="eyebrow mb-6">salons · barbershops · spas</p>
          <h1 className="font-display font-light tracking-[-0.015em] leading-[0.95] mb-8 text-foreground text-6xl sm:text-8xl">
            Beautifully<br />
            <em className="italic font-light text-accent">booked.</em>
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed font-light">
            A refined booking platform for places where people come to feel their best.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/signup"><Button size="lg" className="text-base px-8 h-12">Begin free trial</Button></Link>
            <Link href="/pricing"><Button size="lg" variant="outline" className="text-base px-8 h-12">View pricing</Button></Link>
          </div>
          <p className="text-xs text-muted-foreground mt-8 tracking-[0.15em] uppercase">
            14 days free · no card required · from £15 per chair
          </p>
        </div>
        <div className="gold-rule" />
      </section>

      {/* Treatment categories */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="eyebrow mb-4">for every kind of beauty business</p>
          <h2 className="font-display text-5xl sm:text-6xl font-light tracking-tight">
            One platform, <em className="italic text-accent">every treatment.</em>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-md overflow-hidden">
          {categories.map((c) => (
            <div key={c.title} className="group p-6 bg-card hover:bg-accent/5 transition">
              <div className="font-display text-xl mb-1.5">{c.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ornament */}
      <div className="max-w-xs mx-auto px-6">
        <div className="ornament">
          <span className="font-display italic text-accent text-lg">b</span>
        </div>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="eyebrow mb-4">refined &amp; uncomplicated</p>
          <h2 className="font-display text-5xl sm:text-6xl font-light tracking-tight">
            Everything you need. <em className="italic text-accent">Nothing more.</em>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="bg-card border-border/60 hover:border-accent/40 hover:shadow-sm transition">
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent grid place-items-center mb-3">
                  {f.icon}
                </div>
                <CardTitle className="font-display text-2xl font-medium">{f.title}</CardTitle>
                <CardDescription className="leading-relaxed">{f.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="bg-primary text-primary-foreground py-28 relative overflow-hidden">
        <div className="gold-rule absolute top-0 left-0 right-0" />
        <div className="gold-rule absolute bottom-0 left-0 right-0" />
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="eyebrow mb-6 text-accent">honest pricing</p>
          <h2 className="font-display text-6xl sm:text-7xl font-light mb-6">
            £15 <span className="opacity-60 text-4xl">per chair, per month.</span>
          </h2>
          <p className="text-lg opacity-80 mb-12 font-light">
            Pay for the chairs you have. Add seats as you grow. Cancel anytime.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-base px-8 h-12">
              Begin your free trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 text-center text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto px-6">
          <Wordmark size="md" className="block mb-3" as="div" />
          <p className="opacity-70 text-xs uppercase tracking-[0.25em]">
            © {new Date().getFullYear()} · made for those who make people feel beautiful
          </p>
        </div>
      </footer>
    </div>
  );
}

const categories = [
  { title: "Hair Salons", body: "Cuts, colour, styling." },
  { title: "Barbershops", body: "Cuts, beards, shaves." },
  { title: "Day Spas", body: "Massage, facials, body." },
  { title: "Nail Studios", body: "Mani, pedi, gel, extensions." },
  { title: "Skin Clinics", body: "Facials, peels, treatments." },
  { title: "Brows & Lashes", body: "Lifts, lamination, extensions." },
  { title: "Waxing Studios", body: "Face, body, intimate." },
  { title: "Makeup Artists", body: "Bridal, events, editorial." },
];

const features = [
  { icon: <Calendar className="w-5 h-5" />, title: "Online booking, 24/7", body: "Clients book themselves around your live schedule. No more phone tag." },
  { icon: <Users className="w-5 h-5" />, title: "Multi-chair scheduling", body: "Each stylist, therapist, or technician gets their own diary and clients." },
  { icon: <Code className="w-5 h-5" />, title: "Embed on your website", body: "One <script> tag drops a beautiful booking form onto your existing site." },
  { icon: <Globe className="w-5 h-5" />, title: "Your branded subdomain", body: "yoursalon.bonheur.app, ready to share. Bring your own domain anytime." },
  { icon: <Bell className="w-5 h-5" />, title: "Email confirmations & reminders", body: "Automatic confirmations and 24-hour reminders that reduce no-shows." },
  { icon: <CreditCard className="w-5 h-5" />, title: "Transparent pricing", body: "£15 per chair, per month. Add seats as you grow. Honest." },
];

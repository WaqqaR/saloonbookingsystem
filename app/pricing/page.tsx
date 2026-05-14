import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wordmark } from "@/components/wordmark";
import { Check } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/"><Wordmark size="md" /></Link>
          <nav className="flex items-center gap-1">
            <Link href="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link href="/signup"><Button>Start free trial</Button></Link>
          </nav>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="eyebrow mb-5">pricing</p>
        <h1 className="font-display text-6xl sm:text-7xl font-light tracking-tight mb-5">
          Simple. <em className="italic text-accent">Transparent.</em>
        </h1>
        <p className="text-muted-foreground mb-16 leading-relaxed">
          One flat rate per chair. No setup fees. No long-term contracts. Ever.
        </p>

        <Card className="text-left bg-card border-border/60 shadow-sm overflow-hidden">
          <div className="gold-rule" />
          <CardHeader className="pt-10">
            <CardTitle className="font-display text-3xl font-medium">Per chair</CardTitle>
            <CardDescription>Billed monthly. Each active staff member counts as one chair.</CardDescription>
          </CardHeader>
          <CardContent className="pb-10">
            <div className="flex items-end gap-2 mb-12">
              <span className="font-display text-8xl font-light text-primary leading-none">£15</span>
              <span className="text-muted-foreground mb-4 font-light">/ chair / month</span>
            </div>
            <ul className="space-y-3.5 mb-12 text-sm">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-accent/10 text-accent grid place-items-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup"><Button size="lg" className="w-full h-12 text-base">Begin 14-day free trial</Button></Link>
            <p className="text-xs text-muted-foreground text-center mt-5 tracking-[0.15em] uppercase">no card required</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const benefits = [
  "Unlimited bookings and clients",
  "Multi-chair scheduling with individual hours",
  "Online booking page on your own subdomain",
  "Embeddable widget for your existing website",
  "Client database with booking history & notes",
  "Email confirmations and 24-hour reminders",
  "Built for salons, barbershops & spas alike",
  "Cancel anytime, your data stays yours",
];

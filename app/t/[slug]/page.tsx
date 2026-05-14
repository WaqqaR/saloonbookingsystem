import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Calendar, Clock, MapPin } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      products: { where: { active: true }, orderBy: { sortOrder: "asc" } },
      businessHours: { orderBy: { dayOfWeek: "asc" } },
      staff: { where: { active: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!tenant) notFound();

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="tracking-wide">{tenant.name}</span>
          </div>
          <Link href={`/t/${slug}/book`}><Button>Book appointment</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden warm-vignette">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 barber-stripe hidden md:block" />
        <div className="absolute right-0 top-0 bottom-0 w-1.5 barber-stripe hidden md:block" />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent mb-4">Established with care</p>
          <h1 className="font-display text-5xl sm:text-7xl font-semibold tracking-tight mb-6 leading-[1.05]">
            Welcome to <em className="not-italic font-display italic text-accent">{tenant.name}.</em>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Skilled hands. Honest pricing. Book your next appointment online in under a minute.
          </p>
          <Link href={`/t/${slug}/book`}>
            <Button size="lg" className="text-base px-7">
              <Calendar className="w-4 h-4" /> Book your appointment
            </Button>
          </Link>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-accent mb-3">The menu</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight">Services & pricing</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tenant.services.map((s) => (
            <Card key={s.id} className="bg-card border-border/70 hover:border-accent/40 hover:shadow-md transition">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="font-display text-xl">{s.name}</CardTitle>
                  {s.category && <Badge variant="secondary" className="font-sans">{s.category}</Badge>}
                </div>
                {s.description && <CardDescription className="leading-relaxed">{s.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t border-border/60 pt-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {formatDuration(s.durationMinutes)}
                </div>
                <div className="font-display text-2xl font-semibold text-primary">{formatPrice(s.priceCents, tenant.currency)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Staff (if any) */}
      {tenant.staff.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-accent mb-3">The team</p>
            <h2 className="font-display text-4xl font-semibold tracking-tight">Meet your stylists</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tenant.staff.map((s) => (
              <Card key={s.id} className="bg-card border-border/70 text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full grid place-items-center font-display text-2xl text-primary-foreground" style={{ background: s.color || "hsl(var(--primary))" }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="font-display text-lg">{s.name}</div>
                  {s.bio && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.bio}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {tenant.products.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-accent mb-3">The shop</p>
            <h2 className="font-display text-4xl font-semibold tracking-tight">Products we love</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tenant.products.map((p) => (
              <Card key={p.id} className="bg-card border-border/70">
                <CardHeader>
                  <CardTitle className="font-display text-lg">{p.name}</CardTitle>
                  <CardDescription className="leading-relaxed">{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between border-t border-border/60 pt-4">
                  <div className="text-sm text-muted-foreground">{p.stock > 0 ? "In stock" : <span className="text-destructive">Out of stock</span>}</div>
                  <div className="font-display text-xl font-semibold text-primary">{formatPrice(p.priceCents, tenant.currency)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Hours */}
      <section className="bg-primary text-primary-foreground py-16 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 barber-stripe" />
        <div className="absolute right-0 top-0 bottom-0 w-1.5 barber-stripe" />
        <div className="max-w-md mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">Opening times</p>
            <h2 className="font-display text-3xl font-semibold">Visit us</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {tenant.businessHours.map((h) => (
              <li key={h.id} className="flex justify-between border-b border-primary-foreground/15 pb-2">
                <span className="font-medium">{dayNames[h.dayOfWeek]}</span>
                <span className="opacity-80">{h.open ? `${h.openTime} – ${h.closeTime}` : "Closed"}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center">
            <Link href={`/t/${slug}/book`}><Button variant="secondary">Book now</Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto px-6">
          <div className="font-display tracking-wide text-base mb-2">{tenant.name}</div>
          <p className="text-xs opacity-70">© {new Date().getFullYear()}</p>
          <p className="text-[11px] tracking-[0.2em] uppercase mt-4 opacity-50">
            booked with <em className="font-display italic lowercase text-accent not-italic">bonheur</em>
          </p>
        </div>
      </footer>
    </div>
  );
}

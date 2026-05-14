# Barbershop SaaS

Multi-tenant booking platform for barbershops & salons. Customers sign up, pay £15/chair/month, and get their own subdomain with admin, booking page, and an embeddable widget.

## Stack

Next.js 16 · React 19 · Prisma + SQLite (swap to Postgres for prod) · Stripe · Resend · Tailwind · Radix UI

## Architecture at a glance

| Surface | Hosted at | Purpose |
|---|---|---|
| Marketing | `lvh.me:3000` (apex) | Landing page, pricing, signup, login |
| Tenant booking | `<slug>.lvh.me:3000` | Public booking page for each shop |
| Tenant admin | `<slug>.lvh.me:3000/admin` | Owner-only dashboard, services, staff, customers, billing |
| Embed | `lvh.me:3000/embed/<slug>/book` + `/widget.js?shop=<slug>` | Drop on any external site |
| Public API | `/api/t/<slug>/...` | Services, staff, availability, bookings (CORS-open) |
| Admin API | `/api/admin/...` | Session-scoped to the logged-in tenant |

A single Next.js proxy (`proxy.ts`) inspects the `Host` header, extracts the subdomain, and rewrites the URL to `/t/<slug>/...` under the hood. The page tree never needs to know about the subdomain — it just reads the slug from the path.

## Local dev

```bash
npm install
npx prisma db push          # creates dev.db
npm run db:seed             # seeds a "demo" tenant (slug: demo, password: changeme)
npm run dev                 # starts on http://localhost:3000
```

Visit:
- `http://localhost:3000` — marketing site
- `http://localhost:3000/signup` — sign up a new shop
- `http://demo.lvh.me:3000` — the seeded demo tenant's public booking page
- `http://demo.lvh.me:3000/admin` — log in as `owner@demo.local` / `changeme`

`lvh.me` is a public DNS that always resolves to 127.0.0.1, so wildcard subdomains "just work" locally with no `/etc/hosts` editing.

## Multi-tenancy

Every row in `Service`, `Product`, `Booking`, `Customer`, `Staff`, `BusinessHours`, `BlockedTime`, `User`, and `Setting` carries a `tenantId` FK. Cross-tenant access is blocked at the data layer (every admin API query is filtered by `session.tenantId`) and at the session layer (`requireTenantAdmin(slug)` redirects the user to their own admin if they hit another tenant's URL).

## Billing

Per-seat Stripe subscription. Each active staff member counts as one seat at £15/month. Adding or deactivating staff calls `syncSeats()` which updates the Stripe `SubscriptionItem` quantity with proration.

Configure in `.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...    # the £15/month recurring price
STRIPE_TRIAL_DAYS=14
```

Without these set, signup still works — tenants land in a "trialing" state and can use everything, but no Stripe customer is created. Wire up keys when you're ready to charge.

Stripe webhook: point `https://yourdomain/api/stripe/webhook` at the events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Email

Booking confirmations and 24h reminders via Resend. The reminder job lives at `/api/cron/reminders` — schedule it hourly via Vercel Cron in `vercel.ts`. Without `RESEND_API_KEY` set, emails are logged to the console instead.

## Embed widget

Each tenant gets a snippet they can paste anywhere:

```html
<div data-salon-booking></div>
<script src="https://yoursaas.com/widget.js?shop=acme" async defer></script>
```

The widget loads an iframe pointing at `/embed/acme/book`, auto-resizes via `postMessage`, and is fully CORS-open. There's also `SalonBooking.open()` for a modal trigger.

## Production deployment (Vercel)

1. Switch the Prisma datasource to `postgresql` and add a Postgres integration from the Vercel Marketplace (Neon recommended).
2. Add `*.yourdomain.com` and `yourdomain.com` to your Vercel project. Wildcard SSL is auto-provisioned.
3. Set env: `STRIPE_*`, `RESEND_API_KEY`, `AUTH_SECRET` (32+ chars), `APP_BASE_DOMAIN=yourdomain.com`, `APP_PROTOCOL=https`.
4. Set up Stripe webhook to point at `https://yourdomain.com/api/stripe/webhook`.
5. Schedule the reminder cron in `vercel.ts`:
   ```ts
   crons: [{ path: "/api/cron/reminders", schedule: "0 * * * *" }]
   ```

## What's next (deferred from v1)

- SMS reminders (Twilio integration; needs per-tenant phone-number provisioning)
- Customer-side payments / deposits (Stripe Connect, per-tenant payouts)
- Multi-location per tenant
- Marketing campaigns (broadcast email/SMS)
- POS for in-shop sales
- Loyalty / rewards
- Reports & analytics dashboard
- Custom domains per tenant (`book.acmecuts.co.uk`)
- Calendar sync (Google / iCal)

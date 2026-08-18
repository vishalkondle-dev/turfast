# Turfast — Online Turf & Sports Venue Booking Platform

A production-quality marketplace for booking sports venues and organising games — think
BookMyShow × Airbnb × Playo, focused entirely on sports. One coherent product where every
action propagates: a booking flips slot availability, lands on the owner's calendar, writes a
payment record, updates revenue/analytics, fires a notification, and mints a check-in QR.

## Stack (never surfaced in the product UI)

- **Next.js** (App Router) — customer, owner, staff & admin surfaces
- **Hono** — public REST API at `/api/v1/*`
- **Drizzle ORM** over **SQLite** locally (libSQL) / **Cloudflare D1** on deploy — one schema, dual driver
- **Durable Objects** — `ResourceLock` (slot-lock authority) + `GameRoom` (WebSocket game chat) for Cloudflare
- **better-auth** — passwordless email-OTP
- **Cashfree** payments behind a `PaymentGateway` interface, with a simulated gateway fallback
- **KV / R2** bindings wired for OTP + media on Cloudflare
- Deployment via **OpenNext** (`@opennextjs/cloudflare`)

## Run locally

```bash
npm install --legacy-peer-deps
npm run db:reset      # create SQLite schema + seed realistic demo data
npm run dev           # http://localhost:3000
```

No external services are required in dev: OTP codes print to the console (and a one-click demo
login is available), and payments use the simulated gateway.

### Demo accounts (one-click on the login page)

| Role     | Email                | Surface        |
|----------|----------------------|----------------|
| Customer | vishal@turfast.test  | `/`            |
| Owner    | owner@turfast.test   | `/owner`       |
| Staff    | staff@turfast.test   | `/staff`       |
| Admin    | admin@turfast.test   | `/admin`       |

## What works end to end

- **Discovery** — home rails, search with filters, list + map views, SEO landing pages (`/s/football-turfs-in-hyderabad`)
- **Booking loop** — venue detail → real-time slots → hold → checkout (coupon + wallet + fees) → payment (success/failure/timeout) → confirmation + QR → receipt
- **Race-safe bookings** — DO lock authority on Cloudflare; unique partial index on `(resource, start)` locally (see `src/db/concurrency-check.ts`)
- **Manage** — my bookings, cancel (policy-based refund → wallet), reschedule (price-diff / credit), reviews
- **Games** — create, join, group chat, split pricing
- **Owner** — dashboard, calendar (block/unblock), bookings, walk-ins, pricing, offers/coupons, reviews, revenue/payouts, analytics, staff, 12-step onboarding
- **Staff** — today's schedule, QR check-in (no double check-in), walk-ins, slot management
- **Admin** — KPIs, venue approval/feature, users, owners, payments, refunds, reviews moderation, disputes, support, payouts, audit log
- **Loyalty** — wallet, rewards, referrals, membership, notifications

## Tests

```bash
npm test                              # 17 unit tests: pricing, availability, refunds, coupons, splits, reschedule
npx tsx src/db/concurrency-check.ts   # double-booking guard integration check
```

## Cloudflare deploy

```bash
# provision D1 + KV, fill the ids in wrangler.jsonc, then:
npm run cf:deploy     # opennextjs-cloudflare build && wrangler deploy
```

Set secrets for production: `MAIL_API_KEY`, `CASHFREE_APP_ID`, `CASHFREE_SECRET`, `BETTER_AUTH_SECRET`.

## Project layout

```
src/db/           Drizzle schema, migrations, seed
src/lib/core/     Pure business-rules engine (pricing, availability, refund, reschedule, split, coupons) + tests
src/lib/          db accessor, auth, mail, payments, queries, mutations, owner/staff helpers
src/app/(customer)  customer surface (mobile-first bottom nav)
src/app/owner|staff|admin   role dashboards (sidebar shells)
src/app/api/v1/   Hono REST API
src/app/api/…     availability, auth, games, dev-login route handlers
src/workers/      ResourceLock + GameRoom Durable Objects (Cloudflare)
```

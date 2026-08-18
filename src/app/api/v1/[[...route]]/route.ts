import { Hono } from "hono";
import { handle } from "hono/vercel";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { searchVenues, getVenueBySlug, listSports, listCities, getResourceTakenIntervals } from "@/lib/queries";
import { generateSlots } from "@/lib/core/availability";

/**
 * Public REST API built with Hono, mounted under /api/v1.
 * Runs on the Next.js runtime locally and on Cloudflare Workers when deployed.
 */
const app = new Hono().basePath("/api/v1");

app.get("/health", (c) => c.json({ ok: true, service: "turfast", ts: Date.now() }));

app.get("/sports", async (c) => c.json({ sports: await listSports() }));
app.get("/cities", async (c) => c.json({ cities: await listCities() }));

app.get("/venues", async (c) => {
  const q = c.req.query();
  const venues = await searchVenues({
    citySlug: q.city, sportSlug: q.sport, q: q.q,
    maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
    minRating: q.minRating ? Number(q.minRating) : undefined,
    sort: q.sort as any,
  });
  return c.json({ count: venues.length, venues: venues.map((v) => ({ id: v.id, name: v.name, slug: v.slug, rating: v.rating, reviewCount: v.reviewCount, city: v.cityName, locality: v.localityName, startingPrice: v.startingPrice, sports: v.sports.map((s) => s.slug), coverImage: v.coverImage, featured: v.featured })) });
});

app.get("/venues/:slug", async (c) => {
  const data = await getVenueBySlug(c.req.param("slug"));
  if (!data) return c.json({ error: "not_found" }, 404);
  return c.json({
    venue: { ...data.venue, city: data.cityName, locality: data.localityName },
    resources: data.resources.map((r) => ({ id: r.id, name: r.name, sportId: r.sportId, basePrice: r.basePrice, durations: r.allowedDurations })),
    sports: data.sports, amenities: data.amenities,
    reviews: data.reviews.length,
  });
});

app.get("/availability", async (c) => {
  const rid = c.req.query("resourceId");
  const date = c.req.query("date");
  const duration = Number(c.req.query("duration") || 60);
  if (!rid || !date) return c.json({ error: "missing_params" }, 400);
  const res = (await getDb().select().from(t.resources).where(eq(t.resources.id, rid)).limit(1))[0];
  if (!res) return c.json({ error: "not_found" }, 404);
  const [y, m, d] = date.split("-").map(Number);
  const dayStart = new Date(y, m - 1, d).getTime();
  const taken = await getResourceTakenIntervals(rid, dayStart, dayStart + 86400000);
  const slots = generateSlots({ date: new Date(y, m - 1, d), openHour: res.openHour, closeHour: res.closeHour, durationMins: duration, stepMins: 30, booked: taken.booked, reserved: taken.reserved, blocked: taken.blocked });
  return c.json({ resourceId: rid, date, slots });
});

app.notFound((c) => c.json({ error: "not_found" }, 404));

export const GET = handle(app);
export const POST = handle(app);

import { and, desc, eq, gte, inArray, like, lt, or, sql, asc } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";

/** Server-only read helpers. All accept an optional D1 binding for Cloudflare. */

export async function listSports(d1?: D1Database) {
  return getDb(d1).select().from(t.sports).where(eq(t.sports.isActive, true)).orderBy(asc(t.sports.sortOrder));
}

export async function listCities(d1?: D1Database) {
  return getDb(d1).select().from(t.cities).where(eq(t.cities.isActive, true));
}

export async function listAmenities(d1?: D1Database) {
  return getDb(d1).select().from(t.amenities);
}

export type VenueFilter = {
  citySlug?: string;
  sportSlug?: string;
  q?: string;
  maxPrice?: number;
  minRating?: number;
  indoor?: boolean;
  sort?: "rating" | "price" | "popularity";
  featured?: boolean;
};

export async function searchVenues(f: VenueFilter = {}, d1?: D1Database) {
  const db = getDb(d1);
  const conds = [eq(t.venues.status, "approved")];
  if (f.citySlug) {
    const c = (await db.select().from(t.cities).where(eq(t.cities.slug, f.citySlug)).limit(1))[0];
    if (c) conds.push(eq(t.venues.cityId, c.id));
  }
  if (f.q) conds.push(like(t.venues.name, `%${f.q}%`) as any);
  if (f.minRating) conds.push(gte(t.venues.rating, f.minRating));
  if (f.indoor != null) conds.push(eq(t.venues.isIndoor, f.indoor));

  let rows = await db.select().from(t.venues).where(and(...conds));

  // sport filter via venue_sports
  if (f.sportSlug) {
    const sport = (await db.select().from(t.sports).where(eq(t.sports.slug, f.sportSlug)).limit(1))[0];
    if (sport) {
      const vs = await db.select().from(t.venueSports).where(eq(t.venueSports.sportId, sport.id));
      const ids = new Set(vs.map((v) => v.venueId));
      rows = rows.filter((r) => ids.has(r.id));
    }
  }

  // attach starting price + sports
  const enriched = await Promise.all(rows.map((v) => enrichVenueCard(v, db)));
  let out = enriched;
  if (f.maxPrice) out = out.filter((v) => v.startingPrice <= f.maxPrice!);
  if (f.featured) out = out.filter((v) => v.featured);

  if (f.sort === "price") out.sort((a, b) => a.startingPrice - b.startingPrice);
  else if (f.sort === "popularity") out.sort((a, b) => b.reviewCount - a.reviewCount);
  else out.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  return out;
}

export type VenueCard = typeof t.venues.$inferSelect & {
  startingPrice: number;
  sports: (typeof t.sports.$inferSelect)[];
  cityName: string;
  localityName: string;
};

async function enrichVenueCard(v: typeof t.venues.$inferSelect, db = getDb()): Promise<VenueCard> {
  const res = await db.select().from(t.resources).where(eq(t.resources.venueId, v.id));
  const startingPrice = res.length ? Math.min(...res.map((r) => r.basePrice)) : 0;
  const vs = await db.select().from(t.venueSports).where(eq(t.venueSports.venueId, v.id));
  const sports = vs.length ? await db.select().from(t.sports).where(inArray(t.sports.id, vs.map((x) => x.sportId))) : [];
  const city = (await db.select().from(t.cities).where(eq(t.cities.id, v.cityId)).limit(1))[0];
  const loc = v.localityId ? (await db.select().from(t.localities).where(eq(t.localities.id, v.localityId)).limit(1))[0] : null;
  return { ...v, startingPrice, sports, cityName: city?.name ?? "", localityName: loc?.name ?? "" };
}

export async function getVenueBySlug(slug: string, d1?: D1Database) {
  const db = getDb(d1);
  const venue = (await db.select().from(t.venues).where(eq(t.venues.slug, slug)).limit(1))[0];
  if (!venue) return null;
  const [resources, media, vs, va, reviews] = await Promise.all([
    db.select().from(t.resources).where(and(eq(t.resources.venueId, venue.id), eq(t.resources.isActive, true))),
    db.select().from(t.venueMedia).where(eq(t.venueMedia.venueId, venue.id)).orderBy(asc(t.venueMedia.sortOrder)),
    db.select().from(t.venueSports).where(eq(t.venueSports.venueId, venue.id)),
    db.select().from(t.venueAmenities).where(eq(t.venueAmenities.venueId, venue.id)),
    db.select().from(t.reviews).where(and(eq(t.reviews.venueId, venue.id), eq(t.reviews.status, "published"))).orderBy(desc(t.reviews.createdAt)).limit(20),
  ]);
  const sports = vs.length ? await db.select().from(t.sports).where(inArray(t.sports.id, vs.map((x) => x.sportId))) : [];
  const amenities = va.length ? await db.select().from(t.amenities).where(inArray(t.amenities.id, va.map((x) => x.amenityId))) : [];
  const city = (await db.select().from(t.cities).where(eq(t.cities.id, venue.cityId)).limit(1))[0];
  const loc = venue.localityId ? (await db.select().from(t.localities).where(eq(t.localities.id, venue.localityId)).limit(1))[0] : null;
  const pricing = resources.length ? await db.select().from(t.pricingRules).where(inArray(t.pricingRules.resourceId, resources.map((r) => r.id))) : [];
  // hydrate review author names
  const authorIds = [...new Set(reviews.map((r) => r.userId))];
  const authors = authorIds.length ? await db.select().from(t.users).where(inArray(t.users.id, authorIds)) : [];
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));
  return {
    venue, resources, media, sports, amenities, pricing,
    cityName: city?.name ?? "", localityName: loc?.name ?? "",
    reviews: reviews.map((r) => ({ ...r, authorName: authorMap[r.userId]?.name ?? "Player", authorImage: authorMap[r.userId]?.image })),
  };
}

export async function getResourceTakenIntervals(resourceId: string, dayStart: number, dayEnd: number, d1?: D1Database) {
  const db = getDb(d1);
  const activeStatuses = ["pending", "payment_pending", "confirmed", "checked_in", "completed", "rescheduled", "disputed"];
  const [bk, resv, mb] = await Promise.all([
    db.select().from(t.bookings).where(and(eq(t.bookings.resourceId, resourceId), inArray(t.bookings.status, activeStatuses as any), gte(t.bookings.startsAt, new Date(dayStart)), lt(t.bookings.startsAt, new Date(dayEnd)))),
    db.select().from(t.reservations).where(and(eq(t.reservations.resourceId, resourceId), eq(t.reservations.status, "held"), gte(t.reservations.expiresAt, new Date()))),
    db.select().from(t.maintenanceBlocks).where(and(eq(t.maintenanceBlocks.resourceId, resourceId), lt(t.maintenanceBlocks.startsAt, new Date(dayEnd)), gte(t.maintenanceBlocks.endsAt, new Date(dayStart)))),
  ]);
  return {
    booked: bk.map((b) => ({ start: +b.startsAt, end: +b.endsAt })),
    reserved: resv.map((r) => ({ start: +r.startsAt, end: +r.endsAt })),
    blocked: mb.map((m) => ({ start: +m.startsAt, end: +m.endsAt })),
  };
}

export async function getUserBookings(userId: string, d1?: D1Database) {
  const db = getDb(d1);
  const rows = await db.select().from(t.bookings).where(eq(t.bookings.userId, userId)).orderBy(desc(t.bookings.startsAt));
  return hydrateBookings(rows, db);
}

export async function hydrateBookings(rows: (typeof t.bookings.$inferSelect)[], db = getDb()) {
  if (!rows.length) return [];
  const venueIds = [...new Set(rows.map((r) => r.venueId))];
  const sportIds = [...new Set(rows.map((r) => r.sportId))];
  const resIds = [...new Set(rows.map((r) => r.resourceId))];
  const [venues, sports, resources] = await Promise.all([
    db.select().from(t.venues).where(inArray(t.venues.id, venueIds)),
    db.select().from(t.sports).where(inArray(t.sports.id, sportIds)),
    db.select().from(t.resources).where(inArray(t.resources.id, resIds)),
  ]);
  const vm = Object.fromEntries(venues.map((v) => [v.id, v]));
  const sm = Object.fromEntries(sports.map((v) => [v.id, v]));
  const rm = Object.fromEntries(resources.map((v) => [v.id, v]));
  return rows.map((b) => ({ ...b, venue: vm[b.venueId], sport: sm[b.sportId], resource: rm[b.resourceId] }));
}

export async function getNotifications(userId: string, d1?: D1Database) {
  return getDb(d1).select().from(t.notifications).where(eq(t.notifications.userId, userId)).orderBy(desc(t.notifications.createdAt)).limit(50);
}

export async function getOffers(d1?: D1Database) {
  return getDb(d1).select().from(t.offers).where(eq(t.offers.active, true));
}

export async function getWallet(userId: string, d1?: D1Database) {
  const db = getDb(d1);
  const w = (await db.select().from(t.wallets).where(eq(t.wallets.userId, userId)).limit(1))[0];
  const txns = w ? await db.select().from(t.walletTransactions).where(eq(t.walletTransactions.walletId, w.id)).orderBy(desc(t.walletTransactions.createdAt)) : [];
  return { wallet: w, txns };
}

export async function listGames(d1?: D1Database) {
  const db = getDb(d1);
  const rows = await db.select().from(t.games).where(gte(t.games.startsAt, new Date(Date.now() - 3600000))).orderBy(asc(t.games.startsAt));
  const venueIds = [...new Set(rows.map((r) => r.venueId))];
  const sportIds = [...new Set(rows.map((r) => r.sportId))];
  const hostIds = [...new Set(rows.map((r) => r.hostId))];
  const [venues, sports, hosts, parts] = await Promise.all([
    venueIds.length ? db.select().from(t.venues).where(inArray(t.venues.id, venueIds)) : [],
    sportIds.length ? db.select().from(t.sports).where(inArray(t.sports.id, sportIds)) : [],
    hostIds.length ? db.select().from(t.users).where(inArray(t.users.id, hostIds)) : [],
    rows.length ? db.select().from(t.gameParticipants).where(inArray(t.gameParticipants.gameId, rows.map((r) => r.id))) : [],
  ]);
  const vm = Object.fromEntries(venues.map((v) => [v.id, v]));
  const sm = Object.fromEntries(sports.map((v) => [v.id, v]));
  const hm = Object.fromEntries(hosts.map((v) => [v.id, v]));
  return rows.map((g) => ({
    ...g, venue: vm[g.venueId], sport: sm[g.sportId], host: hm[g.hostId],
    joined: parts.filter((p) => p.gameId === g.id).length,
  }));
}

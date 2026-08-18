import { nanoid } from "nanoid";
import { getDb } from "./index";
import * as s from "./schema";
import {
  SPORTS, AMENITIES, CITIES, LOCALITIES, VENUE_IMAGES, VENUE_NAMES,
  FIRST_NAMES, LAST_NAMES, REVIEW_TEXTS,
} from "./seed-data";

/* deterministic RNG so re-seeds are stable */
let _s = 1337;
const rnd = () => ((_s = (_s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const rint = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const rid = () => nanoid();
const DAY = 86400000;

function midnight(offsetDays: number, hour = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour);
  return d;
}

async function main() {
  const db = getDb();
  console.log("🌱 Seeding Turfast…");

  // wipe (order respects FKs loosely; libSQL has FKs off by default)
  const tables = [
    s.auditLogs, s.payouts, s.disputes, s.supportTickets, s.notificationPrefs, s.notifications,
    s.favorites, s.reviews, s.gameMessages, s.gameParticipants, s.games,
    s.membershipSubscriptions, s.memberships, s.offers, s.coupons,
    s.referrals, s.rewardsLedger, s.walletTransactions, s.wallets,
    s.refunds, s.payments, s.bookingParticipants, s.bookings, s.reservations,
    s.staff, s.maintenanceBlocks, s.pricingRules, s.operatingHours, s.holidays,
    s.resources, s.venueSports, s.venueAmenities, s.venueMedia, s.venues, s.owners,
    s.amenities, s.sports, s.localities, s.cities,
    s.userProfiles, s.verifications, s.accounts, s.sessions, s.users, s.settings,
  ];
  for (const t of tables) await db.delete(t);

  /* ---------- sports / amenities / cities ---------- */
  const sportRows = SPORTS.map((sp, i) => ({ id: rid(), name: sp.name, slug: sp.slug, icon: sp.icon, color: sp.color, isActive: true, sortOrder: i }));
  await db.insert(s.sports).values(sportRows);
  const sportBySlug = Object.fromEntries(sportRows.map((r) => [r.slug, r]));

  const amenityRows = AMENITIES.map((a) => ({ id: rid(), name: a.name, slug: a.slug, icon: a.icon }));
  await db.insert(s.amenities).values(amenityRows);

  const cityRows = CITIES.map((c) => ({ id: rid(), name: c.name, slug: c.slug, state: c.state, lat: c.lat, lng: c.lng, isActive: true }));
  await db.insert(s.cities).values(cityRows);
  const cityBySlug = Object.fromEntries(cityRows.map((r) => [r.slug, r]));

  const localityRows: (typeof s.localities.$inferInsert)[] = [];
  for (const [citySlug, locs] of Object.entries(LOCALITIES)) {
    for (const l of locs) localityRows.push({ id: rid(), cityId: cityBySlug[citySlug].id, name: l.name, slug: l.slug, lat: l.lat, lng: l.lng });
  }
  await db.insert(s.localities).values(localityRows);
  const localitiesByCity: Record<string, typeof localityRows> = {};
  for (const l of localityRows) (localitiesByCity[l.cityId] ??= []).push(l);

  /* ---------- users ---------- */
  const now = Date.now();
  const mkUser = (over: Partial<typeof s.users.$inferInsert> & { email: string; name: string }): typeof s.users.$inferInsert => ({
    id: rid(), emailVerified: true, role: "customer", status: "active",
    referralCode: (over.name.split(" ")[0].toUpperCase() + rint(100, 999)),
    loyaltyPoints: rint(0, 800), createdAt: new Date(now - rint(10, 300) * DAY), updatedAt: new Date(),
    ...over,
  });

  const demoCustomer = mkUser({ email: "vishal@turfast.test", name: "Vishal Kondle", phone: "9000000001", loyaltyPoints: 640, referralCode: "VISHAL500" });
  const demoOwnerUser = mkUser({ email: "owner@turfast.test", name: "Elite Sports Group", phone: "9000000002", role: "owner" });
  const demoStaffUser = mkUser({ email: "staff@turfast.test", name: "Ravi Staff", phone: "9000000003", role: "staff" });
  const demoAdmin = mkUser({ email: "admin@turfast.test", name: "Platform Admin", phone: "9000000004", role: "admin" });

  const players = range(24).map(() => {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    return mkUser({ email: `${name.toLowerCase().replace(/[^a-z]/g, "")}${rint(1, 999)}@example.com`, name, cityId: cityBySlug.hyderabad.id });
  });
  const extraOwners = range(4).map((i) => mkUser({ email: `owner${i + 2}@turfast.test`, name: `${pick(FIRST_NAMES)} Sports Co`, role: "owner", phone: "90000100" + i }));

  const allUsers = [demoCustomer, demoOwnerUser, demoStaffUser, demoAdmin, ...players, ...extraOwners];
  await db.insert(s.users).values(allUsers);

  // wallets + profiles for everyone
  await db.insert(s.wallets).values(allUsers.map((u) => ({ id: rid(), userId: u.id, balance: u.email === "vishal@turfast.test" ? 750 : rint(0, 400), updatedAt: new Date() })));
  await db.insert(s.userProfiles).values(allUsers.filter((u) => u.role === "customer").map((u) => ({
    id: rid(), userId: u.id, favoriteSports: [pick(SPORTS).slug, pick(SPORTS).slug],
    skillLevels: { football: pick(["beginner", "intermediate", "advanced"]) },
    preferredTimes: [pick(["morning", "evening", "night"])],
  })));
  await db.insert(s.notificationPrefs).values(allUsers.map((u) => ({ userId: u.id })));

  /* ---------- owners ---------- */
  const ownerRows = [
    { id: rid(), userId: demoOwnerUser.id, businessName: "Elite Sports Group", contactName: "Suresh Rao", contactPhone: "9000000002", contactEmail: "owner@turfast.test", status: "approved" as const, gstin: "36ABCDE1234F1Z5", panNumber: "ABCDE1234F", bankAccount: "50100XXXXXX8821", bankIfsc: "HDFC0001234", createdAt: new Date(now - 200 * DAY) },
    ...extraOwners.map((o) => ({ id: rid(), userId: o.id, businessName: o.name, contactName: o.name, contactPhone: o.phone!, contactEmail: o.email, status: pick(["approved", "approved", "pending"]) as "approved" | "pending", createdAt: new Date(now - rint(30, 180) * DAY) })),
  ];
  await db.insert(s.owners).values(ownerRows);

  /* ---------- venues + resources + pricing ---------- */
  const venueRows: (typeof s.venues.$inferInsert)[] = [];
  const resourceRows: (typeof s.resources.$inferInsert)[] = [];
  const pricingRows: (typeof s.pricingRules.$inferInsert)[] = [];
  const mediaRows: (typeof s.venueMedia.$inferInsert)[] = [];
  const vaRows: (typeof s.venueAmenities.$inferInsert)[] = [];
  const vsRows: (typeof s.venueSports.$inferInsert)[] = [];
  const ohRows: (typeof s.operatingHours.$inferInsert)[] = [];

  VENUE_NAMES.forEach((vname, i) => {
    const owner = i < 8 ? ownerRows[0] : pick(ownerRows.filter((o) => o.status === "approved"));
    const citySlug = i < 16 ? "hyderabad" : pick(["bengaluru", "pune"]);
    const city = cityBySlug[citySlug];
    const loc = pick(localitiesByCity[city.id]);
    const vid = rid();
    const rating = Math.round((3.6 + rnd() * 1.4) * 10) / 10;
    venueRows.push({
      id: vid, ownerId: owner.id, name: vname, slug: `${vname.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${loc.slug}`.replace(/-+$/, ""),
      description: `${vname} is a premium sports destination in ${loc.name}, ${city.name}. Featuring professionally maintained playing surfaces, powerful floodlights and a welcoming atmosphere for players of every level.`,
      cityId: city.id, localityId: loc.id, address: `Plot ${rint(1, 99)}, ${loc.name}, ${city.name}`, lat: (loc.lat ?? 17.4) + (rnd() - 0.5) * 0.02, lng: (loc.lng ?? 78.4) + (rnd() - 0.5) * 0.02,
      phone: "040-4" + rint(1000000, 9999999), coverImage: VENUE_IMAGES[i % VENUE_IMAGES.length],
      rating, reviewCount: rint(12, 240), isIndoor: rnd() > 0.6, venueType: pick(["turf", "arena", "court complex", "sports hub"]),
      status: "approved", featured: i < 4, sponsored: i >= 4 && i < 7, trending: i >= 7 && i < 11,
      createdAt: new Date(now - rint(20, 220) * DAY),
    });

    // media gallery
    range(rint(3, 5)).forEach((k) => mediaRows.push({ id: rid(), venueId: vid, url: VENUE_IMAGES[(i + k) % VENUE_IMAGES.length], type: "image", sortOrder: k }));
    // amenities (subset)
    const shuffled = [...amenityRows].sort(() => rnd() - 0.5).slice(0, rint(6, 11));
    shuffled.forEach((a) => vaRows.push({ venueId: vid, amenityId: a.id }));
    // operating hours
    range(7).forEach((d) => ohRows.push({ id: rid(), venueId: vid, dayOfWeek: d, openHour: 6, closeHour: 23, isClosed: false }));

    // sports for this venue (2-4)
    const venueSportSlugs = [...new Set([pick(SPORTS).slug, pick(SPORTS).slug, pick(SPORTS).slug])].slice(0, rint(2, 4));
    venueSportSlugs.forEach((slug) => {
      const sport = sportBySlug[slug];
      vsRows.push({ venueId: vid, sportId: sport.id });
      // 1-2 resources per sport
      range(rint(1, 2)).forEach((rIdx) => {
        const resId = rid();
        const base = rint(6, 18) * 100; // ₹600–1800
        resourceRows.push({
          id: resId, venueId: vid, sportId: sport.id, name: `${sport.name} ${["Turf", "Court", "Ground", "Arena"][rIdx % 4]} ${rIdx + 1}`,
          capacity: sport.slug === "football" ? 12 : sport.slug.includes("cricket") ? 16 : rint(2, 8),
          allowedDurations: sport.slug === "badminton" ? [30, 60, 90] : [60, 90, 120],
          openHour: 6, closeHour: 23, basePrice: base, isActive: true,
        });
        // pricing: off-peak + peak, weekday/weekend
        pricingRows.push(
          { id: rid(), resourceId: resId, label: "Weekday Off-Peak", dayType: "weekday", startHour: 6, endHour: 16, price: Math.round(base * 0.6), priority: 2 },
          { id: rid(), resourceId: resId, label: "Weekday Peak", dayType: "weekday", startHour: 16, endHour: 23, price: base, priority: 2 },
          { id: rid(), resourceId: resId, label: "Weekend Off-Peak", dayType: "weekend", startHour: 6, endHour: 16, price: Math.round(base * 0.8), priority: 3 },
          { id: rid(), resourceId: resId, label: "Weekend Peak", dayType: "weekend", startHour: 16, endHour: 23, price: Math.round(base * 1.25), priority: 3 },
        );
      });
    });
  });
  await db.insert(s.venues).values(venueRows);
  await db.insert(s.venueMedia).values(mediaRows);
  await db.insert(s.venueAmenities).values(vaRows);
  await db.insert(s.venueSports).values(vsRows);
  await db.insert(s.operatingHours).values(ohRows);
  await db.insert(s.resources).values(resourceRows);
  await db.insert(s.pricingRules).values(pricingRows);

  const resByVenue: Record<string, typeof resourceRows> = {};
  for (const r of resourceRows) (resByVenue[r.venueId] ??= []).push(r);

  /* ---------- staff for demo owner's first venue ---------- */
  const eliteVenues = venueRows.filter((v) => v.ownerId === ownerRows[0].id);
  await db.insert(s.staff).values([{ id: rid(), userId: demoStaffUser.id, ownerId: ownerRows[0].id, venueId: eliteVenues[0].id, permissions: ["view_bookings", "checkin", "walkin", "calendar"], status: "active", createdAt: new Date(now - 90 * DAY) }]);

  /* ---------- maintenance blocks ---------- */
  const mbRows: (typeof s.maintenanceBlocks.$inferInsert)[] = [];
  eliteVenues.slice(0, 3).forEach((v) => {
    const res = resByVenue[v.id][0];
    const st = midnight(rint(1, 5), 11);
    mbRows.push({ id: rid(), resourceId: res.id, reason: pick(["maintenance", "cleaning", "repairs"]), startsAt: st, endsAt: new Date(st.getTime() + 2 * 3600000), note: "Scheduled upkeep", createdBy: demoOwnerUser.id, createdAt: new Date() });
  });
  await db.insert(s.maintenanceBlocks).values(mbRows);

  /* ---------- coupons / offers / memberships ---------- */
  await db.insert(s.coupons).values([
    { id: rid(), code: "WELCOME100", description: "20% off your first booking (up to ₹100)", type: "percent", value: 20, maxDiscount: 100, minAmount: 300, scope: "first_booking", active: true, usedCount: 42, createdAt: new Date() },
    { id: rid(), code: "FIRSTGAME", description: "Flat ₹200 off for new users", type: "flat", value: 200, minAmount: 800, scope: "new_user", active: true, usedCount: 18, createdAt: new Date() },
    { id: rid(), code: "WEEKEND15", description: "15% off on weekends", type: "percent", value: 15, maxDiscount: 250, minAmount: 500, scope: "all", validDays: [0, 6], active: true, usedCount: 96, createdAt: new Date() },
    { id: rid(), code: "NIGHTOWL", description: "₹150 off night slots after 8 PM", type: "flat", value: 150, minAmount: 600, scope: "all", startHour: 20, endHour: 23, active: true, usedCount: 61, createdAt: new Date() },
    { id: rid(), code: "ELITE10", description: "10% off at Elite Sports Arena", type: "percent", value: 10, maxDiscount: 200, minAmount: 400, scope: "venue", scopeRef: eliteVenues[0].id, ownerId: ownerRows[0].id, active: true, usedCount: 12, createdAt: new Date() },
  ]);
  await db.insert(s.offers).values([
    { id: rid(), title: "Weekend Warriors", description: "Book any weekend slot and get 15% off with WEEKEND15", image: VENUE_IMAGES[2], couponCode: "WEEKEND15", active: true, createdAt: new Date() },
    { id: rid(), title: "First Game Free-ish", description: "New here? Flat ₹200 off with FIRSTGAME", image: VENUE_IMAGES[5], couponCode: "FIRSTGAME", active: true, createdAt: new Date() },
    { id: rid(), title: "Night Owl Special", description: "₹150 off on late night slots", image: VENUE_IMAGES[8], couponCode: "NIGHTOWL", active: true, createdAt: new Date() },
  ]);
  const memRows = [
    { id: rid(), name: "Player Pass", description: "Monthly membership with booking perks", price: 999, durationDays: 30, discountPct: 10, perks: ["10% booking discount", "Priority booking", "Exclusive offers", "Reduced platform fees"], active: true },
    { id: rid(), name: "Pro Pass", description: "For the serious player", price: 2499, durationDays: 90, discountPct: 15, perks: ["15% booking discount", "Priority booking", "Free equipment rental", "2 guest passes / month"], active: true },
  ];
  await db.insert(s.memberships).values(memRows);
  await db.insert(s.membershipSubscriptions).values([{ id: rid(), membershipId: memRows[0].id, userId: demoCustomer.id, startsAt: new Date(now - 10 * DAY), endsAt: new Date(now + 20 * DAY), status: "active", createdAt: new Date() }]);

  /* ---------- bookings + payments + reviews ---------- */
  const bookingRows: (typeof s.bookings.$inferInsert)[] = [];
  const paymentRows: (typeof s.payments.$inferInsert)[] = [];
  const reviewRows: (typeof s.reviews.$inferInsert)[] = [];
  const notifRows: (typeof s.notifications.$inferInsert)[] = [];
  let bkCounter = 1000;
  const usedSlots = new Set<string>(); // resourceId|startMs — enforce unique live slots

  const customers = [demoCustomer, ...players];

  function makeBooking(user: typeof s.users.$inferInsert, venue: typeof s.venues.$inferInsert, dayOffset: number, hour: number, status: typeof s.bookings.$inferInsert["status"]) {
    let res = pick(resByVenue[venue.id]);
    let dur = pick(res.allowedDurations as number[]);
    let start = midnight(dayOffset, hour);
    // resample to avoid colliding with an existing live booking on the same resource+start
    let tries = 0;
    while (usedSlots.has(`${res.id}|${start.getTime()}`) && tries++ < 12) {
      res = pick(resByVenue[venue.id]);
      dur = pick(res.allowedDurations as number[]);
      start = midnight(dayOffset, ((hour + tries) % 15) + 7);
    }
    const active = status !== "cancelled";
    if (active) usedSlots.add(`${res.id}|${start.getTime()}`);
    const end = new Date(start.getTime() + dur * 60000);
    const base = Math.round((res.basePrice * dur) / 60);
    const discount = rnd() > 0.7 ? pick([100, 150, 200]) : 0;
    const platformFee = Math.round((base - discount) * 0.04);
    const total = base - discount + platformFee;
    const code = "TRF-" + (bkCounter++);
    const bid = rid();
    bookingRows.push({
      id: bid, code, userId: user.id, venueId: venue.id, resourceId: res.id, sportId: res.sportId,
      startsAt: start, endsAt: end, durationMins: dur, status, source: "online",
      basePrice: base, discount, couponCode: discount ? "WEEKEND15" : null, walletUsed: 0, platformFee, tax: 0, totalAmount: total,
      qrToken: rid(), createdAt: new Date(start.getTime() - rint(1, 20) * DAY),
    });
    if (status !== "cancelled")
      paymentRows.push({ id: rid(), bookingId: bid, userId: user.id, amount: total, method: pick(["upi", "card", "netbanking"]), gateway: "simulated", gatewayRef: "sim_" + rid().slice(0, 10), status: "successful", kind: "booking", createdAt: new Date(start.getTime() - rint(1, 20) * DAY) });
    if (status === "completed" && rnd() > 0.4)
      reviewRows.push({ id: rid(), venueId: venue.id, userId: user.id, bookingId: bid, overall: rint(3, 5), quality: rint(3, 5), cleanliness: rint(3, 5), staffRating: rint(3, 5), facilities: rint(3, 5), valueForMoney: rint(3, 5), body: pick(REVIEW_TEXTS), status: "published", createdAt: new Date(end.getTime() + DAY) });
    return { bid, code, venue, start };
  }

  // demo customer: upcoming, completed, cancelled
  const upcoming = makeBooking(demoCustomer, eliteVenues[0], 2, 20, "confirmed");
  makeBooking(demoCustomer, eliteVenues[1] ?? venueRows[1], 4, 19, "confirmed");
  range(5).forEach((k) => makeBooking(demoCustomer, pick(venueRows), -rint(3, 40), rint(7, 21), "completed"));
  makeBooking(demoCustomer, pick(venueRows), -6, 18, "cancelled");

  // spread across players for revenue/analytics
  customers.forEach((u) => {
    range(rint(2, 6)).forEach(() => {
      const v = rnd() > 0.4 ? pick(eliteVenues) : pick(venueRows);
      const past = rnd() > 0.35;
      makeBooking(u, v, past ? -rint(1, 60) : rint(1, 10), rint(7, 22), past ? "completed" : pick(["confirmed", "confirmed", "payment_pending"]));
    });
  });

  await db.insert(s.bookings).values(bookingRows);
  if (paymentRows.length) await db.insert(s.payments).values(paymentRows);
  if (reviewRows.length) await db.insert(s.reviews).values(reviewRows);

  // notifications for demo customer
  notifRows.push(
    { id: rid(), userId: demoCustomer.id, title: "Booking confirmed 🎉", body: `Your ${upcoming.venue.name} slot is confirmed. See you on the field!`, type: "booking", href: "/bookings", read: false, createdAt: new Date(now - 3600000) },
    { id: rid(), userId: demoCustomer.id, title: "₹150 off tonight", body: "Use NIGHTOWL on any slot after 8 PM.", type: "offer", href: "/offers", read: false, createdAt: new Date(now - 2 * 3600000) },
    { id: rid(), userId: demoCustomer.id, title: "Reminder: game tomorrow", body: "Your football game at Elite Sports Arena is coming up.", type: "reminder", href: "/games", read: true, createdAt: new Date(now - 26 * 3600000) },
  );
  await db.insert(s.notifications).values(notifRows);

  /* ---------- games ---------- */
  const gameRows: (typeof s.games.$inferInsert)[] = [];
  const gpRows: (typeof s.gameParticipants.$inferInsert)[] = [];
  const gmRows: (typeof s.gameMessages.$inferInsert)[] = [];
  range(10).forEach((i) => {
    const venue = pick(eliteVenues.concat(venueRows.slice(0, 8)));
    const res = pick(resByVenue[venue.id]);
    const host = pick(customers);
    const start = midnight(rint(1, 8), pick([18, 19, 20, 21]));
    const dur = 90;
    const needed = pick([8, 10, 12, 14]);
    const gid = rid();
    gameRows.push({
      id: gid, title: `${sportBySlug[Object.keys(sportBySlug).find((k) => sportBySlug[k].id === res.sportId)!].name} at ${venue.name}`,
      hostId: host.id, venueId: venue.id, resourceId: res.id, sportId: res.sportId,
      startsAt: start, endsAt: new Date(start.getTime() + dur * 60000), playersNeeded: needed,
      pricePerPlayer: pick([120, 150, 180, 200]), skillLevel: pick(["any", "beginner", "intermediate", "advanced"]),
      gameType: pick(["friendly", "competitive", "practice"]), visibility: "public", status: "open",
      notes: "Bring your own shoes. Bibs provided.", createdAt: new Date(now - rint(1, 8) * DAY),
    });
    const joinCount = rint(3, needed - 1);
    const joiners = [host, ...customers.filter((c) => c.id !== host.id).sort(() => rnd() - 0.5).slice(0, joinCount - 1)];
    joiners.forEach((j, k) => gpRows.push({ id: rid(), gameId: gid, userId: j.id, paid: rnd() > 0.3, isHost: k === 0, joinedAt: new Date(now - rint(1, 6) * DAY) }));
    gmRows.push(
      { id: rid(), gameId: gid, userId: host.id, body: "Hey everyone! Let's have a great game 🔥", kind: "message", createdAt: new Date(now - 5 * 3600000) },
      { id: rid(), gameId: gid, userId: joiners[1]?.id ?? host.id, body: "Count me in. What color bibs?", kind: "message", createdAt: new Date(now - 4 * 3600000) },
      { id: rid(), gameId: gid, userId: host.id, body: `${joinCount}/${needed} joined. Need a few more!`, kind: "announcement", createdAt: new Date(now - 3 * 3600000) },
    );
  });
  await db.insert(s.games).values(gameRows);
  await db.insert(s.gameParticipants).values(gpRows);
  await db.insert(s.gameMessages).values(gmRows);

  /* ---------- favorites, referrals, rewards, wallet tx ---------- */
  await db.insert(s.favorites).values(eliteVenues.slice(0, 3).map((v) => ({ id: rid(), userId: demoCustomer.id, venueId: v.id, createdAt: new Date() })));
  await db.insert(s.referrals).values([
    { id: rid(), referrerId: demoCustomer.id, refereeId: players[0].id, code: "VISHAL500", status: "completed", rewardPoints: 500, createdAt: new Date(now - 12 * DAY) },
    { id: rid(), referrerId: demoCustomer.id, code: "VISHAL500", status: "pending", rewardPoints: 0, createdAt: new Date(now - 2 * DAY) },
  ]);
  const walletDemo = (await db.select().from(s.wallets).where(eqUser(s.wallets.userId, demoCustomer.id)))[0];
  if (walletDemo) {
    await db.insert(s.walletTransactions).values([
      { id: rid(), walletId: walletDemo.id, amount: 500, balanceAfter: 500, type: "refund", note: "Refund for cancelled booking", createdAt: new Date(now - 6 * DAY) },
      { id: rid(), walletId: walletDemo.id, amount: 250, balanceAfter: 750, type: "reward", note: "Loyalty reward redeemed to wallet", createdAt: new Date(now - 3 * DAY) },
    ]);
  }
  await db.insert(s.rewardsLedger).values([
    { id: rid(), userId: demoCustomer.id, points: 500, reason: "referral", note: "Friend joined via VISHAL500", createdAt: new Date(now - 12 * DAY) },
    { id: rid(), userId: demoCustomer.id, points: 100, reason: "review", note: "Reviewed Elite Sports Arena", createdAt: new Date(now - 8 * DAY) },
    { id: rid(), userId: demoCustomer.id, points: 40, reason: "booking", note: "Booking reward", createdAt: new Date(now - 5 * DAY) },
  ]);

  /* ---------- payouts + disputes + support ---------- */
  await db.insert(s.payouts).values(range(4).map((i) => ({ id: rid(), ownerId: ownerRows[0].id, amount: rint(8000, 45000), reference: "PO-" + rint(100000, 999999), status: (i === 0 ? "pending" : "paid") as "pending" | "paid", periodStart: new Date(now - (i + 1) * 7 * DAY), periodEnd: new Date(now - i * 7 * DAY), createdAt: new Date(now - i * 7 * DAY) })));
  await db.insert(s.disputes).values([{ id: rid(), code: "DSP-" + rint(1000, 9999), bookingId: bookingRows[0].id, userId: demoCustomer.id, venueId: eliteVenues[0].id, reason: "poor_facilities", detail: "Floodlights were partially off during my slot.", status: "open", createdAt: new Date(now - DAY) }]);
  await db.insert(s.supportTickets).values([{ id: rid(), code: "TKT-" + rint(1000, 9999), userId: demoCustomer.id, category: "refund", subject: "Refund not received", body: "I cancelled 2 days ago but haven't seen the refund.", status: "open", createdAt: new Date(now - 2 * DAY) }]);

  /* ---------- audit + settings ---------- */
  await db.insert(s.auditLogs).values([
    { id: rid(), actorId: demoOwnerUser.id, actorRole: "owner", action: "price.update", entity: "resource", entityId: resourceRows[0].id, prevValue: "₹1,200", newValue: "₹1,500", createdAt: new Date(now - 4 * DAY) },
    { id: rid(), actorId: demoAdmin.id, actorRole: "admin", action: "venue.approve", entity: "venue", entityId: eliteVenues[0].id, newValue: "approved", createdAt: new Date(now - 30 * DAY) },
    { id: rid(), actorId: demoCustomer.id, actorRole: "customer", action: "booking.cancel", entity: "booking", entityId: bookingRows[0].id, createdAt: new Date(now - 6 * DAY) },
  ]);
  await db.insert(s.settings).values([
    { key: "platform_fee_pct", value: "4" },
    { key: "currency", value: "INR" },
    { key: "brand_tagline", value: "Book Your Game. Own Your Time." },
  ]);

  console.log(`✅ Seeded: ${allUsers.length} users, ${venueRows.length} venues, ${resourceRows.length} resources, ${bookingRows.length} bookings, ${gameRows.length} games.`);
  console.log(`   Demo logins (OTP shown in console when no mail key): vishal@turfast.test (customer), owner@turfast.test, staff@turfast.test, admin@turfast.test`);
}

// tiny local eq helper to avoid importing operators at top (keeps file self-contained)
import { eq } from "drizzle-orm";
function eqUser(col: any, val: string) { return eq(col, val); }

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

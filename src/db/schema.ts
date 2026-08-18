import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/* ---------- helpers ---------- */
const id = () => text("id").primaryKey();
const createdAt = () => integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`);
const updatedAt = () => integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`);

/* =====================================================================
   AUTH (better-auth core tables) + platform users
   ===================================================================== */
export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  // platform fields
  role: text("role", { enum: ["customer", "owner", "staff", "admin"] }).notNull().default("customer"),
  status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  cityId: text("city_id"),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = sqliteTable("sessions", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const accounts = sqliteTable("accounts", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const verifications = sqliteTable("verifications", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* =====================================================================
   PROFILE
   ===================================================================== */
export const userProfiles = sqliteTable("user_profiles", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  bio: text("bio"),
  favoriteSports: text("favorite_sports", { mode: "json" }).$type<string[]>().default([]),
  skillLevels: text("skill_levels", { mode: "json" }).$type<Record<string, string>>().default({}),
  preferredTimes: text("preferred_times", { mode: "json" }).$type<string[]>().default([]),
  localityId: text("locality_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* =====================================================================
   GEO + SPORTS
   ===================================================================== */
export const cities = sqliteTable("cities", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  state: text("state").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const localities = sqliteTable("localities", {
  id: id(),
  cityId: text("city_id").notNull().references(() => cities.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  lat: real("lat"),
  lng: real("lng"),
}, (t) => ({ cityIdx: index("loc_city_idx").on(t.cityId) }));

export const sports = sqliteTable("sports", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull().default("Circle"),
  color: text("color").notNull().default("#16a34a"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* =====================================================================
   OWNERS + VENUES + RESOURCES
   ===================================================================== */
export const owners = sqliteTable("owners", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email").notNull(),
  gstin: text("gstin"),
  panNumber: text("pan_number"),
  bankAccount: text("bank_account"),
  bankIfsc: text("bank_ifsc"),
  status: text("status", { enum: ["pending", "approved", "suspended"] }).notNull().default("pending"),
  createdAt: createdAt(),
});

export const venues = sqliteTable("venues", {
  id: id(),
  ownerId: text("owner_id").notNull().references(() => owners.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  cityId: text("city_id").notNull().references(() => cities.id),
  localityId: text("locality_id").references(() => localities.id),
  address: text("address").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  phone: text("phone"),
  coverImage: text("cover_image").notNull(),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  isIndoor: integer("is_indoor", { mode: "boolean" }).notNull().default(false),
  venueType: text("venue_type").notNull().default("turf"),
  status: text("status", { enum: ["draft", "submitted", "under_review", "approved", "rejected", "suspended"] }).notNull().default("draft"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sponsored: integer("sponsored", { mode: "boolean" }).notNull().default(false),
  trending: integer("trending", { mode: "boolean" }).notNull().default(false),
  cancellationPolicy: text("cancellation_policy", { mode: "json" }).$type<{ hours: number; refundPct: number }[]>().default([
    { hours: 24, refundPct: 100 },
    { hours: 12, refundPct: 50 },
    { hours: 0, refundPct: 0 },
  ]),
  createdAt: createdAt(),
}, (t) => ({
  cityIdx: index("venue_city_idx").on(t.cityId),
  statusIdx: index("venue_status_idx").on(t.status),
}));

export const venueMedia = sqliteTable("venue_media", {
  id: id(),
  venueId: text("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: text("type", { enum: ["image", "video"] }).notNull().default("image"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const amenities = sqliteTable("amenities", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull().default("Check"),
});

export const venueAmenities = sqliteTable("venue_amenities", {
  venueId: text("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  amenityId: text("amenity_id").notNull().references(() => amenities.id),
}, (t) => ({ pk: uniqueIndex("va_pk").on(t.venueId, t.amenityId) }));

export const venueSports = sqliteTable("venue_sports", {
  venueId: text("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  sportId: text("sport_id").notNull().references(() => sports.id),
}, (t) => ({ pk: uniqueIndex("vs_pk").on(t.venueId, t.sportId) }));

// bookable resources: turfs / courts
export const resources = sqliteTable("resources", {
  id: id(),
  venueId: text("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  sportId: text("sport_id").notNull().references(() => sports.id),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull().default(10),
  allowedDurations: text("allowed_durations", { mode: "json" }).$type<number[]>().notNull().default([60, 90]),
  openHour: integer("open_hour").notNull().default(6),   // 24h
  closeHour: integer("close_hour").notNull().default(23),
  basePrice: integer("base_price").notNull(),            // ₹ per hour
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
}, (t) => ({ venueIdx: index("res_venue_idx").on(t.venueId) }));

export const operatingHours = sqliteTable("operating_hours", {
  id: id(),
  venueId: text("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 Sun .. 6 Sat
  openHour: integer("open_hour").notNull(),
  closeHour: integer("close_hour").notNull(),
  isClosed: integer("is_closed", { mode: "boolean" }).notNull().default(false),
});

export const holidays = sqliteTable("holidays", {
  id: id(),
  venueId: text("venue_id").references(() => venues.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  name: text("name").notNull(),
});

// pricing rules override base price for windows
export const pricingRules = sqliteTable("pricing_rules", {
  id: id(),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  dayType: text("day_type", { enum: ["all", "weekday", "weekend", "holiday"] }).notNull().default("all"),
  startHour: integer("start_hour").notNull(),
  endHour: integer("end_hour").notNull(),
  price: integer("price").notNull(), // ₹ per hour
  priority: integer("priority").notNull().default(0),
}, (t) => ({ resIdx: index("pr_res_idx").on(t.resourceId) }));

export const maintenanceBlocks = sqliteTable("maintenance_blocks", {
  id: id(),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  reason: text("reason", { enum: ["maintenance", "cleaning", "private_event", "staff_use", "weather", "repairs"] }).notNull().default("maintenance"),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
  note: text("note"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: createdAt(),
}, (t) => ({ resIdx: index("mb_res_idx").on(t.resourceId) }));

/* =====================================================================
   STAFF
   ===================================================================== */
export const staff = sqliteTable("staff", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  ownerId: text("owner_id").notNull().references(() => owners.id),
  venueId: text("venue_id").references(() => venues.id),
  permissions: text("permissions", { mode: "json" }).$type<string[]>().notNull().default(["view_bookings", "checkin"]),
  status: text("status", { enum: ["active", "disabled"] }).notNull().default("active"),
  createdAt: createdAt(),
});

/* =====================================================================
   RESERVATIONS + BOOKINGS
   ===================================================================== */
// short-lived hold placed before payment
export const reservations = sqliteTable("reservations", {
  id: id(),
  resourceId: text("resource_id").notNull().references(() => resources.id),
  userId: text("user_id").notNull().references(() => users.id),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: ["held", "consumed", "released"] }).notNull().default("held"),
  createdAt: createdAt(),
}, (t) => ({ resTimeIdx: index("resv_res_time_idx").on(t.resourceId, t.startsAt) }));

export const bookings = sqliteTable("bookings", {
  id: id(),
  code: text("code").notNull().unique(), // TRF-XXXXXX
  userId: text("user_id").notNull().references(() => users.id),
  venueId: text("venue_id").notNull().references(() => venues.id),
  resourceId: text("resource_id").notNull().references(() => resources.id),
  sportId: text("sport_id").notNull().references(() => sports.id),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
  durationMins: integer("duration_mins").notNull(),
  status: text("status", {
    enum: ["pending", "payment_pending", "confirmed", "checked_in", "completed", "cancelled", "rescheduled", "refund_pending", "refunded", "no_show", "disputed"],
  }).notNull().default("pending"),
  source: text("source", { enum: ["online", "walkin", "game"] }).notNull().default("online"),
  // money (all in ₹)
  basePrice: integer("base_price").notNull(),
  discount: integer("discount").notNull().default(0),
  couponCode: text("coupon_code"),
  walletUsed: integer("wallet_used").notNull().default(0),
  platformFee: integer("platform_fee").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  qrToken: text("qr_token"),
  checkedInAt: integer("checked_in_at", { mode: "timestamp_ms" }),
  gameId: text("game_id"),
  isSplit: integer("is_split", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  walkinName: text("walkin_name"),
  walkinPhone: text("walkin_phone"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  userIdx: index("bk_user_idx").on(t.userId),
  venueIdx: index("bk_venue_idx").on(t.venueId),
  resTimeIdx: index("bk_res_time_idx").on(t.resourceId, t.startsAt),
  // defense-in-depth: a resource+start can have only ONE live/settled booking.
  // Cancelled/refunded/no-show rows are excluded so a slot can be rebooked.
  slotGuard: uniqueIndex("bk_slot_guard").on(t.resourceId, t.startsAt)
    .where(sql`status in ('pending','payment_pending','confirmed','checked_in','completed','rescheduled','disputed')`),
}));

export const bookingParticipants = sqliteTable("booking_participants", {
  id: id(),
  bookingId: text("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  share: integer("share").notNull(), // ₹ owed
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  isHost: integer("is_host", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

/* =====================================================================
   PAYMENTS (immutable ledger) + REFUNDS
   ===================================================================== */
export const payments = sqliteTable("payments", {
  id: id(),
  bookingId: text("booking_id").references(() => bookings.id),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  method: text("method", { enum: ["upi", "card", "netbanking", "wallet", "cash", "other"] }).notNull().default("upi"),
  gateway: text("gateway").notNull().default("simulated"),
  gatewayRef: text("gateway_ref"),
  status: text("status", { enum: ["pending", "processing", "successful", "failed", "refunded", "partially_refunded"] }).notNull().default("pending"),
  kind: text("kind", { enum: ["booking", "topup", "reschedule_diff", "membership", "split_share"] }).notNull().default("booking"),
  createdAt: createdAt(),
}, (t) => ({ bookingIdx: index("pay_booking_idx").on(t.bookingId) }));

export const refunds = sqliteTable("refunds", {
  id: id(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  paymentId: text("payment_id").references(() => payments.id),
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  method: text("method", { enum: ["original", "wallet"] }).notNull().default("wallet"),
  status: text("status", { enum: ["requested", "processing", "completed", "failed", "rejected"] }).notNull().default("requested"),
  createdAt: createdAt(),
});

/* =====================================================================
   WALLET + LOYALTY + REFERRALS
   ===================================================================== */
export const wallets = sqliteTable("wallets", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  balance: integer("balance").notNull().default(0),
  updatedAt: updatedAt(),
});

export const walletTransactions = sqliteTable("wallet_transactions", {
  id: id(),
  walletId: text("wallet_id").notNull().references(() => wallets.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // +credit / -debit
  balanceAfter: integer("balance_after").notNull(),
  type: text("type", { enum: ["refund", "promo", "cashback", "reward", "topup", "booking", "adjustment"] }).notNull(),
  note: text("note"),
  refId: text("ref_id"),
  createdAt: createdAt(),
}, (t) => ({ walletIdx: index("wtx_wallet_idx").on(t.walletId) }));

export const rewardsLedger = sqliteTable("rewards_ledger", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  points: integer("points").notNull(),
  reason: text("reason", { enum: ["booking", "referral", "review", "game_join", "profile", "streak", "redeem"] }).notNull(),
  note: text("note"),
  createdAt: createdAt(),
}, (t) => ({ userIdx: index("rl_user_idx").on(t.userId) }));

export const referrals = sqliteTable("referrals", {
  id: id(),
  referrerId: text("referrer_id").notNull().references(() => users.id),
  refereeId: text("referee_id").references(() => users.id),
  code: text("code").notNull(),
  status: text("status", { enum: ["pending", "completed"] }).notNull().default("pending"),
  rewardPoints: integer("reward_points").notNull().default(0),
  createdAt: createdAt(),
});

/* =====================================================================
   COUPONS / OFFERS / MEMBERSHIPS
   ===================================================================== */
export const coupons = sqliteTable("coupons", {
  id: id(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  type: text("type", { enum: ["percent", "flat"] }).notNull(),
  value: integer("value").notNull(),
  maxDiscount: integer("max_discount"),
  minAmount: integer("min_amount").notNull().default(0),
  scope: text("scope", { enum: ["all", "venue", "sport", "first_booking", "new_user"] }).notNull().default("all"),
  scopeRef: text("scope_ref"), // venueId or sportId when scoped
  validDays: text("valid_days", { mode: "json" }).$type<number[]>(),
  startHour: integer("start_hour"),
  endHour: integer("end_hour"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  ownerId: text("owner_id").references(() => owners.id),
  createdAt: createdAt(),
});

export const offers = sqliteTable("offers", {
  id: id(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  venueId: text("venue_id").references(() => venues.id),
  couponCode: text("coupon_code"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const memberships = sqliteTable("memberships", {
  id: id(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  durationDays: integer("duration_days").notNull().default(30),
  discountPct: integer("discount_pct").notNull().default(0),
  perks: text("perks", { mode: "json" }).$type<string[]>().notNull().default([]),
  venueId: text("venue_id").references(() => venues.id),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const membershipSubscriptions = sqliteTable("membership_subscriptions", {
  id: id(),
  membershipId: text("membership_id").notNull().references(() => memberships.id),
  userId: text("user_id").notNull().references(() => users.id),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: ["active", "expired", "cancelled"] }).notNull().default("active"),
  createdAt: createdAt(),
});

/* =====================================================================
   GAMES
   ===================================================================== */
export const games = sqliteTable("games", {
  id: id(),
  title: text("title").notNull(),
  hostId: text("host_id").notNull().references(() => users.id),
  venueId: text("venue_id").notNull().references(() => venues.id),
  resourceId: text("resource_id").references(() => resources.id),
  sportId: text("sport_id").notNull().references(() => sports.id),
  bookingId: text("booking_id").references(() => bookings.id),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
  playersNeeded: integer("players_needed").notNull(),
  pricePerPlayer: integer("price_per_player").notNull(),
  skillLevel: text("skill_level", { enum: ["any", "beginner", "intermediate", "advanced"] }).notNull().default("any"),
  gameType: text("game_type", { enum: ["friendly", "competitive", "practice", "tournament"] }).notNull().default("friendly"),
  visibility: text("visibility", { enum: ["public", "friends", "private"] }).notNull().default("public"),
  status: text("status", { enum: ["open", "full", "confirmed", "completed", "cancelled"] }).notNull().default("open"),
  notes: text("notes"),
  createdAt: createdAt(),
}, (t) => ({ startIdx: index("game_start_idx").on(t.startsAt) }));

export const gameParticipants = sqliteTable("game_participants", {
  id: id(),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  isHost: integer("is_host", { mode: "boolean" }).notNull().default(false),
  joinedAt: createdAt(),
}, (t) => ({ uniq: uniqueIndex("gp_uniq").on(t.gameId, t.userId) }));

export const gameMessages = sqliteTable("game_messages", {
  id: id(),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  kind: text("kind", { enum: ["message", "system", "announcement"] }).notNull().default("message"),
  createdAt: createdAt(),
}, (t) => ({ gameIdx: index("gm_game_idx").on(t.gameId) }));

/* =====================================================================
   REVIEWS + FAVORITES
   ===================================================================== */
export const reviews = sqliteTable("reviews", {
  id: id(),
  venueId: text("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  bookingId: text("booking_id").references(() => bookings.id),
  overall: integer("overall").notNull(),
  quality: integer("quality"),
  cleanliness: integer("cleanliness"),
  staffRating: integer("staff_rating"),
  facilities: integer("facilities"),
  valueForMoney: integer("value_for_money"),
  body: text("body"),
  photos: text("photos", { mode: "json" }).$type<string[]>().default([]),
  ownerReply: text("owner_reply"),
  status: text("status", { enum: ["published", "hidden", "flagged"] }).notNull().default("published"),
  createdAt: createdAt(),
}, (t) => ({ venueIdx: index("rev_venue_idx").on(t.venueId) }));

export const favorites = sqliteTable("favorites", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  venueId: text("venue_id").references(() => venues.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => ({ uniq: uniqueIndex("fav_uniq").on(t.userId, t.venueId) }));

/* =====================================================================
   NOTIFICATIONS + SUPPORT + DISPUTES + PAYOUTS + AUDIT
   ===================================================================== */
export const notifications = sqliteTable("notifications", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull().default("general"),
  href: text("href"),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
}, (t) => ({ userIdx: index("notif_user_idx").on(t.userId) }));

export const notificationPrefs = sqliteTable("notification_prefs", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  inApp: integer("in_app", { mode: "boolean" }).notNull().default(true),
  email: integer("email", { mode: "boolean" }).notNull().default(true),
  sms: integer("sms", { mode: "boolean" }).notNull().default(false),
  whatsapp: integer("whatsapp", { mode: "boolean" }).notNull().default(false),
  push: integer("push", { mode: "boolean" }).notNull().default(true),
});

export const supportTickets = sqliteTable("support_tickets", {
  id: id(),
  code: text("code").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id),
  category: text("category", { enum: ["booking", "payment", "refund", "venue", "game", "account", "other"] }).notNull().default("other"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] }).notNull().default("open"),
  createdAt: createdAt(),
});

export const disputes = sqliteTable("disputes", {
  id: id(),
  code: text("code").notNull().unique(),
  bookingId: text("booking_id").references(() => bookings.id),
  userId: text("user_id").notNull().references(() => users.id),
  venueId: text("venue_id").references(() => venues.id),
  reason: text("reason", { enum: ["venue_unavailable", "double_booking", "poor_facilities", "payment_issue", "refund_issue", "staff_behavior", "incorrect_charge"] }).notNull(),
  detail: text("detail").notNull(),
  ownerResponse: text("owner_response"),
  resolution: text("resolution"),
  status: text("status", { enum: ["open", "under_investigation", "awaiting_response", "resolved", "closed"] }).notNull().default("open"),
  createdAt: createdAt(),
});

export const payouts = sqliteTable("payouts", {
  id: id(),
  ownerId: text("owner_id").notNull().references(() => owners.id),
  amount: integer("amount").notNull(),
  reference: text("reference").notNull(),
  status: text("status", { enum: ["pending", "processing", "paid", "failed"] }).notNull().default("pending"),
  periodStart: integer("period_start", { mode: "timestamp_ms" }),
  periodEnd: integer("period_end", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  actorId: text("actor_id").references(() => users.id),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  prevValue: text("prev_value"),
  newValue: text("new_value"),
  meta: text("meta"),
  createdAt: createdAt(),
}, (t) => ({ entityIdx: index("audit_entity_idx").on(t.entity, t.entityId) }));

/* =====================================================================
   platform settings (singleton-ish key/value)
   ===================================================================== */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

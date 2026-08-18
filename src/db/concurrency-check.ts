/** Integration check: the unique partial index must reject a second live booking on the same slot. */
import { nanoid } from "nanoid";
import { getDb } from "./index";
import * as t from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = getDb();
  const res = (await db.select().from(t.resources).limit(1))[0];
  const user = (await db.select().from(t.users).limit(1))[0];
  const start = new Date(2027, 0, 1, 20, 0, 0); // far-future clean slot
  const end = new Date(2027, 0, 1, 21, 0, 0);

  // clean any prior test rows
  await db.delete(t.bookings).where(eq(t.bookings.code, "TEST-DUP-A"));
  await db.delete(t.bookings).where(eq(t.bookings.code, "TEST-DUP-B"));

  const mk = (code: string) => ({
    id: nanoid(), code, userId: user.id, venueId: res.venueId, resourceId: res.id, sportId: res.sportId,
    startsAt: start, endsAt: end, durationMins: 60, status: "confirmed" as const, source: "online" as const,
    basePrice: 1000, discount: 0, walletUsed: 0, platformFee: 40, tax: 0, totalAmount: 1040, qrToken: nanoid(),
  });

  await db.insert(t.bookings).values(mk("TEST-DUP-A"));
  console.log("✓ first booking on slot inserted");

  let rejected = false;
  try {
    await db.insert(t.bookings).values(mk("TEST-DUP-B"));
  } catch (e: any) {
    rejected = true;
    console.log("✓ second booking on SAME slot rejected:", e.code || e.message);
  }

  // now cancel the first and confirm the slot can be rebooked
  await db.update(t.bookings).set({ status: "cancelled" }).where(eq(t.bookings.code, "TEST-DUP-A"));
  let rebooked = false;
  try { await db.insert(t.bookings).values(mk("TEST-DUP-B")); rebooked = true; console.log("✓ slot rebookable after cancellation"); }
  catch { console.log("✗ slot NOT rebookable after cancellation"); }

  // cleanup
  await db.delete(t.bookings).where(eq(t.bookings.code, "TEST-DUP-A"));
  await db.delete(t.bookings).where(eq(t.bookings.code, "TEST-DUP-B"));

  if (rejected && rebooked) { console.log("\n✅ Double-booking guard works and slots free up after cancel."); process.exit(0); }
  console.log("\n❌ Guard check failed."); process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });

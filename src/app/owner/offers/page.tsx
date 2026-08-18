import { eq, or, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getOwnerForUser } from "@/lib/owner";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { OffersManager } from "./offers-manager";

export const dynamic = "force-dynamic";

export default async function OwnerOffersPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const db = getDb();
  const coupons = owner ? await db.select().from(t.coupons).where(or(eq(t.coupons.ownerId, owner.id), isNull(t.coupons.ownerId))) : [];
  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Offers & coupons</h1>
      <p className="text-muted text-sm mb-5">Create promo codes to drive bookings at your venues.</p>
      <OffersManager coupons={coupons.map((c) => ({ id: c.id, code: c.code, description: c.description, type: c.type, value: c.value, minAmount: c.minAmount, usedCount: c.usedCount, active: c.active, owned: c.ownerId === owner?.id }))} />
    </div>
  );
}

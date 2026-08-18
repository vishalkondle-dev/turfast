import { eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerVenues } from "@/lib/owner";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { PricingEditor } from "./pricing-editor";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const venues = owner ? await getOwnerVenues(owner.id) : [];
  const venueIds = venues.map((v) => v.id);
  const db = getDb();
  const resources = venueIds.length ? await db.select().from(t.resources).where(inArray(t.resources.venueId, venueIds)) : [];
  const rules = resources.length ? await db.select().from(t.pricingRules).where(inArray(t.pricingRules.resourceId, resources.map((r) => r.id))) : [];
  const vm = Object.fromEntries(venues.map((v) => [v.id, v.name]));

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Pricing</h1>
      <p className="text-muted text-sm mb-5">Set base prices per court. Peak/off-peak & weekend rules apply automatically.</p>
      <div className="space-y-6">
        {venues.map((v) => (
          <div key={v.id}>
            <h2 className="font-semibold mb-2">{v.name}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {resources.filter((r) => r.venueId === v.id).map((r) => (
                <PricingEditor key={r.id} resource={{ id: r.id, name: r.name, basePrice: r.basePrice }} rules={rules.filter((x) => x.resourceId === r.id).map((x) => ({ label: x.label, price: x.price, dayType: x.dayType, startHour: x.startHour, endHour: x.endHour }))} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

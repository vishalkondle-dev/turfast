import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { AdminVenuesTable } from "./table";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const db = getDb();
  const venues = await db.select().from(t.venues).orderBy(desc(t.venues.createdAt));
  const ownerIds = [...new Set(venues.map((v) => v.ownerId))];
  const owners = ownerIds.length ? await db.select().from(t.owners).where(inArray(t.owners.id, ownerIds)) : [];
  const om = Object.fromEntries(owners.map((o) => [o.id, o.businessName]));
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Venues</h1>
      <AdminVenuesTable venues={venues.map((v) => ({ id: v.id, name: v.name, slug: v.slug, status: v.status, owner: om[v.ownerId] ?? "—", rating: v.rating, reviewCount: v.reviewCount, featured: v.featured, sponsored: v.sponsored, trending: v.trending }))} />
    </div>
  );
}

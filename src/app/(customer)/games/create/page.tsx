import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { CreateGameForm } from "./create-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create a game" };

export default async function CreateGamePage() {
  await requireUser();
  const db = getDb();
  const venues = await db.select().from(t.venues).where(eq(t.venues.status, "approved"));
  const resources = await db.select().from(t.resources);
  const sportIds = [...new Set(resources.map((r) => r.sportId))];
  const sports = sportIds.length ? await db.select().from(t.sports).where(inArray(t.sports.id, sportIds)) : [];
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Create a game</h1>
      <p className="text-muted text-sm mb-5">Pick a venue and slot, set the squad size, and invite players to join.</p>
      <CreateGameForm
        venues={venues.map((v) => ({ id: v.id, name: v.name }))}
        resources={resources.map((r) => ({ id: r.id, venueId: r.venueId, sportId: r.sportId, name: r.name, basePrice: r.basePrice, allowedDurations: r.allowedDurations as number[] }))}
        sports={sports.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}

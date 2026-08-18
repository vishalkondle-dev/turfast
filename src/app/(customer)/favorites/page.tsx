import { eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { VenueCard } from "@/components/venue-card";
import { EmptyState, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Favorites" };

export default async function FavoritesPage() {
  const user = await requireUser();
  const db = getDb();
  const favs = await db.select().from(t.favorites).where(eq(t.favorites.userId, user.id));
  const venueIds = favs.map((f) => f.venueId!).filter(Boolean);
  const venues = venueIds.length ? await db.select().from(t.venues).where(inArray(t.venues.id, venueIds)) : [];
  const cards = await Promise.all(venues.map(async (v) => {
    const res = await db.select().from(t.resources).where(eq(t.resources.venueId, v.id));
    const vs = await db.select().from(t.venueSports).where(eq(t.venueSports.venueId, v.id));
    const sports = vs.length ? await db.select().from(t.sports).where(inArray(t.sports.id, vs.map((x) => x.sportId))) : [];
    const city = (await db.select().from(t.cities).where(eq(t.cities.id, v.cityId)).limit(1))[0];
    const loc = v.localityId ? (await db.select().from(t.localities).where(eq(t.localities.id, v.localityId)).limit(1))[0] : null;
    return { ...v, startingPrice: res.length ? Math.min(...res.map((r) => r.basePrice)) : 0, sports, cityName: city?.name ?? "", localityName: loc?.name ?? "" };
  }));

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">My favorites</h1>
      {cards.length === 0 ? (
        <EmptyState icon="❤️" title="No favorite venues yet" hint="Tap the heart on any venue to save it here." action={<LinkButton href="/explore">Explore venues</LinkButton>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{cards.map((v) => <VenueCard key={v.id} v={v as any} />)}</div>
      )}
    </div>
  );
}

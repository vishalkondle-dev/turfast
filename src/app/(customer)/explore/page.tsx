import { searchVenues, listSports } from "@/lib/queries";
import { VenueCard } from "@/components/venue-card";
import { EmptyState } from "@/components/ui";
import { ExploreFilters } from "./filters";
import { MapView } from "./map-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Explore venues" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const [venues, sports] = await Promise.all([
    searchVenues({
      citySlug: sp.city || "hyderabad",
      sportSlug: sp.sport,
      q: sp.q,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
      minRating: sp.minRating ? Number(sp.minRating) : undefined,
      indoor: sp.indoor === "1" ? true : sp.indoor === "0" ? false : undefined,
      sort: (sp.sort as any) || undefined,
      featured: sp.featured === "1",
    }),
    listSports(),
  ]);
  const view = sp.view || "list";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{sp.sport ? sports.find((s) => s.slug === sp.sport)?.name + " venues" : "Explore venues"}</h1>
          <p className="text-muted text-sm">{venues.length} venues in {(sp.city || "Hyderabad").replace(/^\w/, (c) => c.toUpperCase())}</p>
        </div>
      </div>

      <ExploreFilters sports={sports} current={sp} count={venues.length} />

      {venues.length === 0 ? (
        <EmptyState icon="🔍" title="No venues match your filters" hint="Try widening your price range, distance or clearing the sport filter." />
      ) : view === "map" ? (
        <MapView venues={venues} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {venues.map((v) => <VenueCard key={v.id} v={v} />)}
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { searchVenues, listCities, listSports } from "@/lib/queries";
import { VenueCard } from "@/components/venue-card";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * SEO-friendly landing pages:
 *   /s/football-turfs-in-hyderabad
 *   /s/badminton-courts-in-bengaluru
 *   /s/turfs-in-gachibowli
 * Parses the slug into sport + city filters.
 */
export async function generateMetadata({ params }: { params: Promise<{ seo: string[] }> }) {
  const { seo } = await params;
  const title = decodeURIComponent(seo.join(" ")).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title, description: `Discover and book the best ${title.toLowerCase()} on Turfast.` };
}

export default async function SeoPage({ params }: { params: Promise<{ seo: string[] }> }) {
  const { seo } = await params;
  const slug = seo.join("-").toLowerCase();
  const [cities, sports] = await Promise.all([listCities(), listSports()]);
  const city = cities.find((c) => slug.includes(c.slug));
  const sport = sports.find((s) => slug.includes(s.slug) || slug.includes(s.slug.replace("-", "")));
  const heading = `${sport ? sport.name + " " : ""}Venues${city ? " in " + city.name : ""}`;

  const venues = await searchVenues({ citySlug: city?.slug, sportSlug: sport?.slug, sort: "rating" });

  return (
    <div>
      <div className="rounded-3xl bg-gradient-to-br from-brand to-accent text-white p-6 md:p-8 mb-6">
        <div className="text-sm text-white/80">Turfast · Sports venues</div>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-1">{heading}</h1>
        <p className="text-white/85 mt-2 max-w-xl">Book the best {sport ? sport.name.toLowerCase() : "sports"} venues{city ? ` in ${city.name}` : ""} — real-time availability, transparent pricing and instant confirmation.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {sports.slice(0, 8).map((s) => <Link key={s.id} href={`/s/${s.slug}-venues${city ? "-in-" + city.slug : ""}`} className="chip">{s.name}</Link>)}
      </div>

      {venues.length === 0 ? <EmptyState icon="🔍" title="No venues found" hint="Try a different sport or city." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{venues.map((v) => <VenueCard key={v.id} v={v} />)}</div>
      )}

      <div className="mt-10 prose-sm text-muted max-w-2xl">
        <h2 className="font-bold text-fg">About {heading}</h2>
        <p>Turfast helps you find and book {sport ? sport.name.toLowerCase() : "sports"} venues{city ? ` across ${city.name}` : ""} in seconds. Compare prices, check real-time slot availability, read verified reviews and pay securely online. Organise games, split payments with friends and never miss your slot.</p>
      </div>
    </div>
  );
}

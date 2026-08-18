import Link from "next/link";
import { searchVenues, listSports, getOffers } from "@/lib/queries";
import { VenueRail } from "@/components/venue-card";
import { Section } from "@/components/ui";
import { SPORT_EMOJI } from "@/lib/utils";
import { SearchHero } from "@/components/search-hero";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [all, sports, offers] = await Promise.all([searchVenues({ citySlug: "hyderabad" }), listSports(), getOffers()]);
  const featured = all.filter((v) => v.featured);
  const topRated = [...all].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const trending = all.filter((v) => v.trending).concat(all).slice(0, 8);
  const nearby = [...all].sort(() => 0.5 - Math.random()).slice(0, 8);
  const recent = [...all].sort((a, b) => +b.createdAt - +a.createdAt).slice(0, 8);

  return (
    <div>
      <SearchHero sports={sports} />

      {/* sports categories */}
      <Section title="Browse by sport">
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
          {sports.map((s) => (
            <Link key={s.id} href={`/explore?sport=${s.slug}`} className="shrink-0 w-24 card p-3 text-center hover:border-brand hover:-translate-y-0.5 transition">
              <div className="text-3xl">{SPORT_EMOJI[s.slug] ?? "🎯"}</div>
              <div className="text-xs font-semibold mt-1.5">{s.name}</div>
            </Link>
          ))}
        </div>
      </Section>

      {offers.length > 0 && (
        <Section title="Offers for you">
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar -mx-4 px-4">
            {offers.map((o) => (
              <Link key={o.id} href="/explore" className="shrink-0 w-80 card overflow-hidden hover:shadow-pop transition">
                <div className="p-4 bg-gradient-to-br from-brand/15 to-accent/10">
                  <div className="text-xs font-bold text-brand uppercase tracking-wide">Limited offer</div>
                  <div className="font-bold text-lg mt-1">{o.title}</div>
                  <div className="text-sm text-muted mt-1 line-clamp-2">{o.description}</div>
                  {o.couponCode && <div className="mt-3 inline-block border border-dashed border-brand rounded-lg px-3 py-1 font-mono font-bold text-brand text-sm">{o.couponCode}</div>}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Featured venues" action={<Link href="/explore?featured=1" className="text-sm font-semibold text-brand">See all</Link>}>
        <VenueRail items={featured} />
      </Section>

      <Section title="Available tonight" action={<Link href="/explore" className="text-sm font-semibold text-brand">See all</Link>}>
        <VenueRail items={nearby} />
      </Section>

      <Section title="Top rated" action={<Link href="/explore?sort=rating" className="text-sm font-semibold text-brand">See all</Link>}>
        <VenueRail items={topRated} />
      </Section>

      <Section title="Trending near you">
        <VenueRail items={trending} />
      </Section>

      <Section title="Recently added">
        <VenueRail items={recent} />
      </Section>
    </div>
  );
}

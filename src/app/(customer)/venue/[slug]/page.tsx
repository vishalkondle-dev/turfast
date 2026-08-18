import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Clock, Star, Navigation, Share2 } from "lucide-react";
import { getVenueBySlug } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { Badge, Rating, Avatar, Section } from "@/components/ui";
import { AMENITY_ICON } from "@/components/amenity-icon";
import { BookingWidget } from "./booking-widget";
import { FavoriteButton } from "./favorite-button";
import { fmtDate, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getVenueBySlug(slug);
  if (!data) return { title: "Venue" };
  return { title: data.venue.name, description: data.venue.description };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getVenueBySlug(slug);
  if (!data) notFound();
  const { venue, resources, media, sports, amenities, pricing, reviews, cityName, localityName } = data;
  const user = await getCurrentUser();
  const gallery = [venue.coverImage, ...media.map((m) => m.url)].slice(0, 6);
  const catAvg = (key: "quality" | "cleanliness" | "staffRating" | "facilities" | "valueForMoney") => {
    const vals = reviews.map((r) => (r as any)[key]).filter(Boolean);
    return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : "—";
  };

  return (
    <div>
      {/* gallery */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[280px] md:h-[360px] mb-5">
        <div className="col-span-4 md:col-span-2 row-span-2 relative"><Image src={gallery[0]} alt={venue.name} fill sizes="640px" className="object-cover" priority /></div>
        {gallery.slice(1, 5).map((g, i) => (
          <div key={i} className="hidden md:block relative"><Image src={g} alt="" fill sizes="320px" className="object-cover" /></div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {venue.featured && <Badge tone="brand">Featured</Badge>}
                <Badge tone="muted">{venue.venueType}</Badge>
                {venue.isIndoor ? <Badge tone="accent">Indoor</Badge> : <Badge tone="success">Outdoor</Badge>}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-2">{venue.name}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-muted flex-wrap">
                <Rating value={venue.rating} count={venue.reviewCount} className="text-fg" />
                <span className="flex items-center gap-1 text-sm"><MapPin size={14} /> {localityName}, {cityName}</span>
                {venue.phone && <span className="flex items-center gap-1 text-sm"><Phone size={14} /> {venue.phone}</span>}
                <span className="flex items-center gap-1 text-sm"><Clock size={14} /> 6 AM – 11 PM</span>
              </div>
            </div>
            <div className="flex gap-2">
              <FavoriteButton venueId={venue.id} loggedIn={!!user} />
              <a href={`https://maps.google.com/?q=${venue.lat},${venue.lng}`} target="_blank" rel="noreferrer" className="btn-outline !px-3"><Navigation size={16} /></a>
            </div>
          </div>

          {/* sports */}
          <Section title="Sports available" className="mt-6">
            <div className="flex flex-wrap gap-2">
              {sports.map((s) => <Badge key={s.id} tone="brand" className="!text-sm !px-3 !py-1">{s.name}</Badge>)}
            </div>
          </Section>

          <Section title="About this venue">
            <p className="text-muted leading-relaxed">{venue.description}</p>
          </Section>

          <Section title="Amenities">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map((a) => {
                const Icon = AMENITY_ICON[a.icon] ?? Star;
                return <div key={a.id} className="flex items-center gap-2.5 card p-3"><Icon size={18} className="text-brand" /> <span className="text-sm font-medium">{a.name}</span></div>;
              })}
            </div>
          </Section>

          {/* reviews */}
          <Section title={`Reviews (${venue.reviewCount})`}>
            <div className="card p-4 mb-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <div className="text-4xl font-extrabold">{venue.rating.toFixed(1)}</div>
                  <div className="text-warning">★★★★★</div>
                  <div className="text-xs text-muted mt-1">{venue.reviewCount} reviews</div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm flex-1 min-w-[240px]">
                  {([["Quality", "quality"], ["Cleanliness", "cleanliness"], ["Staff", "staffRating"], ["Facilities", "facilities"], ["Value", "valueForMoney"]] as const).map(([label, key]) => (
                    <div key={key} className="flex justify-between"><span className="text-muted">{label}</span><span className="font-semibold">{catAvg(key)}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {reviews.length === 0 && <p className="text-muted text-sm">No reviews yet — be the first after your game!</p>}
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.authorName} src={r.authorImage} size={36} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{r.authorName}</div>
                      <div className="text-xs text-muted">{fmtDate(new Date(+r.createdAt))}</div>
                    </div>
                    <Badge tone="warning">{r.overall}★</Badge>
                  </div>
                  {r.body && <p className="text-sm mt-2.5 text-muted">{r.body}</p>}
                  {r.ownerReply && <div className="mt-2 text-sm bg-surface-2 rounded-lg p-2.5"><span className="font-semibold text-brand">Owner reply:</span> {r.ownerReply}</div>}
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* sticky booking widget */}
        <div className="lg:sticky lg:top-20 h-fit">
          <BookingWidget venueName={venue.name} sports={sports} resources={resources} loggedIn={!!user} />
          <div className="card p-4 mt-4">
            <div className="text-sm font-semibold mb-2">Starting prices</div>
            <div className="space-y-1.5 text-sm">
              {resources.slice(0, 5).map((r) => (
                <div key={r.id} className="flex justify-between"><span className="text-muted">{r.name}</span><span className="font-semibold">{inr(r.basePrice)}/hr</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

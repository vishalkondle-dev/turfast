"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Navigation } from "lucide-react";
import { Rating } from "@/components/ui";
import { inr } from "@/lib/format";
import type { VenueCard } from "@/lib/queries";

/** Self-contained stylised map (no external tiles). Pins positioned by lat/lng within the city bbox. */
export function MapView({ venues }: { venues: VenueCard[] }) {
  const [active, setActive] = useState<VenueCard | null>(venues[0] ?? null);
  const lats = venues.map((v) => v.lat ?? 17.4), lngs = venues.map((v) => v.lng ?? 78.4);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pos = (v: VenueCard) => ({
    left: `${8 + ((((v.lng ?? 78.4) - minLng) / (maxLng - minLng || 1)) * 84)}%`,
    top: `${88 - ((((v.lat ?? 17.4) - minLat) / (maxLat - minLat || 1)) * 76)}%`,
  });

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4 mt-4">
      <div className="relative h-[560px] rounded-2xl overflow-hidden border border-border bg-[radial-gradient(circle_at_30%_20%,rgb(var(--brand)/.12),transparent_40%),radial-gradient(circle_at_70%_80%,rgb(var(--accent)/.12),transparent_40%)]">
        <div className="absolute inset-0 opacity-[.15]" style={{ backgroundImage: "linear-gradient(rgb(var(--border)) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--border)) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        {venues.map((v) => (
          <button key={v.id} onClick={() => setActive(v)} style={pos(v)} className="absolute -translate-x-1/2 -translate-y-full group">
            <div className={`px-2 py-1 rounded-full text-xs font-bold shadow-pop transition ${active?.id === v.id ? "bg-brand text-brand-fg scale-110" : "bg-surface border border-border"}`}>{inr(v.startingPrice)}</div>
            <div className={`mx-auto h-2 w-2 rotate-45 -mt-1 ${active?.id === v.id ? "bg-brand" : "bg-surface border-r border-b border-border"}`} />
          </button>
        ))}
      </div>

      <div className="space-y-3 lg:max-h-[560px] lg:overflow-auto no-scrollbar">
        {active && (
          <div className="card overflow-hidden animate-fade-in">
            <div className="relative h-32"><Image src={active.coverImage} alt={active.name} fill sizes="360px" className="object-cover" /></div>
            <div className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold">{active.name}</h3><Rating value={active.rating} />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted mt-1"><MapPin size={13} /> {active.localityName}, {active.cityName}</div>
              <div className="text-sm mt-1">From <span className="font-bold">{inr(active.startingPrice)}</span>/hr</div>
              <div className="flex gap-2 mt-3">
                <Link href={`/venue/${active.slug}`} className="btn-brand !py-2 flex-1">Book Now</Link>
                <a href={`https://maps.google.com/?q=${active.lat},${active.lng}`} target="_blank" className="btn-outline !py-2" rel="noreferrer"><Navigation size={16} /></a>
              </div>
            </div>
          </div>
        )}
        {venues.map((v) => (
          <button key={v.id} onClick={() => setActive(v)} className={`w-full text-left card p-3 flex gap-3 hover:border-brand transition ${active?.id === v.id ? "border-brand" : ""}`}>
            <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0"><Image src={v.coverImage} alt={v.name} fill sizes="56px" className="object-cover" /></div>
            <div className="min-w-0">
              <div className="font-semibold text-sm line-clamp-1">{v.name}</div>
              <div className="text-xs text-muted line-clamp-1">{v.localityName}</div>
              <div className="text-xs mt-0.5"><Rating value={v.rating} /> · from {inr(v.startingPrice)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

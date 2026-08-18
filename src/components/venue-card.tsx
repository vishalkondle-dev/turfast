import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Badge, Rating } from "./ui";
import { inr } from "@/lib/format";
import type { VenueCard as VC } from "@/lib/queries";

export function VenueCard({ v, className = "" }: { v: VC; className?: string }) {
  return (
    <Link href={`/venue/${v.slug}`} className={`card overflow-hidden group hover:shadow-pop transition-shadow ${className}`}>
      <div className="relative h-40 w-full overflow-hidden bg-surface-2">
        <Image src={v.coverImage} alt={v.name} fill sizes="360px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          {v.featured && <Badge tone="brand">Featured</Badge>}
          {v.trending && <Badge tone="accent">Trending</Badge>}
          {v.isIndoor && <Badge tone="muted">Indoor</Badge>}
        </div>
        <div className="absolute bottom-2 right-2">
          <Badge tone="success" className="!bg-black/60 !text-white !border-0 backdrop-blur">from {inr(v.startingPrice)}/hr</Badge>
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold leading-tight line-clamp-1">{v.name}</h3>
          <Rating value={v.rating} className="shrink-0" />
        </div>
        <div className="flex items-center gap-1 text-sm text-muted mt-1">
          <MapPin size={13} /> <span className="line-clamp-1">{v.localityName}, {v.cityName}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2.5">
          {v.sports.slice(0, 3).map((s) => (
            <span key={s.id} className="text-xs bg-surface-2 rounded-full px-2 py-0.5 font-medium">{s.name}</span>
          ))}
          {v.sports.length > 3 && <span className="text-xs text-muted px-1 py-0.5">+{v.sports.length - 3}</span>}
        </div>
      </div>
    </Link>
  );
}

export function VenueRail({ items }: { items: VC[] }) {
  return (
    <div className="flex gap-3.5 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x">
      {items.map((v) => (
        <div key={v.id} className="snap-start shrink-0 w-72"><VenueCard v={v} /></div>
      ))}
    </div>
  );
}

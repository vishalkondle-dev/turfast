import Link from "next/link";
import Image from "next/image";
import { eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerVenues } from "@/lib/owner";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge, Rating, EmptyState, LinkButton } from "@/components/ui";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OwnerVenuesPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const venues = owner ? await getOwnerVenues(owner.id) : [];
  const venueIds = venues.map((v) => v.id);
  const resources = venueIds.length ? await getDb().select().from(t.resources).where(inArray(t.resources.venueId, venueIds)) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold">Venues & courts</h1><p className="text-muted text-sm">Manage your listed venues and bookable resources.</p></div>
        <LinkButton href="/onboarding"><Plus size={18} /> Add venue</LinkButton>
      </div>
      {venues.length === 0 ? <EmptyState icon="🏟️" title="No venues yet" hint="List your first venue to start taking bookings." action={<LinkButton href="/onboarding">Add a venue</LinkButton>} /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {venues.map((v) => {
            const res = resources.filter((r) => r.venueId === v.id);
            return (
              <div key={v.id} className="card overflow-hidden">
                <div className="relative h-32"><Image src={v.coverImage} alt={v.name} fill sizes="480px" className="object-cover" /><div className="absolute top-2 right-2"><Badge tone={v.status === "approved" ? "success" : "warning"}>{v.status}</Badge></div></div>
                <div className="p-4">
                  <div className="flex items-center justify-between"><div className="font-bold">{v.name}</div><Rating value={v.rating} count={v.reviewCount} /></div>
                  <div className="text-sm text-muted">{v.address}</div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {res.map((r) => <span key={r.id} className="text-xs bg-surface-2 rounded-full px-2 py-0.5">{r.name}</span>)}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/venue/${v.slug}`} className="btn-outline !py-1.5 !text-sm flex-1">View public page</Link>
                    <Link href="/owner/pricing" className="btn-outline !py-1.5 !text-sm flex-1">Edit pricing</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

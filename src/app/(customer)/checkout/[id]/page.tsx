import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/session";
import { quoteCheckout } from "@/app/actions/booking";
import { CheckoutClient } from "./checkout-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();
  const res = (await db.select().from(t.reservations).where(eq(t.reservations.id, id)).limit(1))[0];
  if (!res) notFound();
  if (res.userId !== user.id) redirect("/");
  if (res.status !== "held" || +res.expiresAt < Date.now()) {
    redirect("/explore?expired=1");
  }

  const resource = (await db.select().from(t.resources).where(eq(t.resources.id, res.resourceId)).limit(1))[0];
  const venue = (await db.select().from(t.venues).where(eq(t.venues.id, resource.venueId)).limit(1))[0];
  const sport = (await db.select().from(t.sports).where(eq(t.sports.id, resource.sportId)).limit(1))[0];
  const wallet = (await db.select().from(t.wallets).where(eq(t.wallets.userId, user.id)).limit(1))[0];
  const quote = await quoteCheckout(id);

  return (
    <CheckoutClient
      reservationId={id}
      expiresAt={+res.expiresAt}
      info={{
        venue: venue.name, sport: sport.name, resource: resource.name,
        start: +res.startsAt, end: +res.endsAt,
        durationMins: Math.round((+res.endsAt - +res.startsAt) / 60000),
        cover: venue.coverImage,
      }}
      initialQuote={quote}
      walletBalance={wallet?.balance ?? 0}
    />
  );
}

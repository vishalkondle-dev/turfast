import { requireUser } from "@/lib/session";
import { listCities, listSports, listAmenities } from "@/lib/queries";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { OnboardingWizard } from "./wizard";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "List your venue" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const [cities, sports, amenities] = await Promise.all([listCities(), listSports(), listAmenities()]);
  const localities = await getDb().select().from(t.localities);
  return (
    <div className="min-h-screen bg-bg">
      <header className="h-14 border-b border-border flex items-center px-4">
        <Link href="/" className="font-extrabold text-xl"><span className="text-brand">Turf</span>ast</Link>
        <span className="ml-3 text-sm text-muted">List your venue</span>
      </header>
      <main className="max-w-2xl mx-auto p-4 md:p-8">
        <OnboardingWizard
          defaults={{ name: user.name, email: user.email, phone: user.phone ?? "" }}
          cities={cities.map((c) => ({ id: c.id, name: c.name }))}
          localities={localities.map((l) => ({ id: l.id, cityId: l.cityId, name: l.name }))}
          sports={sports.map((s) => ({ id: s.id, slug: s.slug, name: s.name }))}
          amenities={amenities.map((a) => ({ slug: a.slug, name: a.name }))}
        />
      </main>
    </div>
  );
}

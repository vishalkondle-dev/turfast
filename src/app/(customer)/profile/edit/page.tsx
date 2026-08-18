import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { listSports } from "@/lib/queries";
import { EditProfileForm } from "./edit-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const user = await requireUser();
  const profile = (await getDb().select().from(t.userProfiles).where(eq(t.userProfiles.userId, user.id)).limit(1))[0];
  const sports = await listSports();
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Edit profile</h1>
      <EditProfileForm
        user={{ name: user.name, phone: user.phone ?? "", email: user.email }}
        sports={sports.map((s) => ({ slug: s.slug, name: s.name }))}
        favoriteSports={profile?.favoriteSports ?? []}
        preferredTimes={profile?.preferredTimes ?? []}
      />
    </div>
  );
}

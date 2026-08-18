"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/app/actions/misc";
import { cn } from "@/lib/utils";

export function EditProfileForm({ user, sports, favoriteSports, preferredTimes }: { user: { name: string; phone: string; email: string }; sports: { slug: string; name: string }[]; favoriteSports: string[]; preferredTimes: string[] }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [favs, setFavs] = useState<string[]>(favoriteSports);
  const [times, setTimes] = useState<string[]>(preferredTimes);
  const [pending, start] = useTransition();

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  function submit() {
    start(async () => { await updateProfile({ name, phone, favoriteSports: favs, preferredTimes: times }); router.push("/profile"); router.refresh(); });
  }
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div><label className="label">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" /></div>
        <div><label className="label">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1" /></div>
        <div><label className="label">Email</label><input value={user.email} disabled className="input mt-1 opacity-60" /></div>
      </div>
      <div className="card p-4">
        <label className="label">Favorite sports</label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {sports.map((s) => <button key={s.slug} onClick={() => toggle(favs, setFavs, s.slug)} className={cn("chip !py-1", favs.includes(s.slug) && "!bg-brand !text-brand-fg !border-brand")}>{s.name}</button>)}
        </div>
        <label className="label mt-4 block">Preferred playing time</label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {["morning", "afternoon", "evening", "night"].map((tm) => <button key={tm} onClick={() => toggle(times, setTimes, tm)} className={cn("chip !py-1 capitalize", times.includes(tm) && "!bg-brand !text-brand-fg !border-brand")}>{tm}</button>)}
        </div>
      </div>
      <button onClick={submit} disabled={pending} className="btn-brand w-full">{pending ? <Loader2 className="animate-spin" size={18} /> : "Save changes"}</button>
    </div>
  );
}

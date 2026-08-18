"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, CalendarDays, Clock } from "lucide-react";

export function SearchHero({ sports }: { sports: { id: string; slug: string; name: string }[] }) {
  const router = useRouter();
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("hyderabad");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("18:00");

  function go() {
    const p = new URLSearchParams();
    if (sport) p.set("sport", sport);
    if (city) p.set("city", city);
    if (date) p.set("date", date);
    if (time) p.set("time", time);
    router.push(`/explore?${p.toString()}`);
  }

  return (
    <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-brand to-accent">
      <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1400&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="relative p-6 md:p-10 text-white">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">Book Your Game.<br />Own Your Time.</h1>
        <p className="mt-2 text-white/85 max-w-md">Find turfs & courts near you. Real-time slots, instant booking, open games with players like you.</p>

        <div className="mt-5 bg-surface text-fg rounded-2xl p-2.5 shadow-pop grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="flex items-center gap-2 px-2 rounded-xl border border-border md:col-span-1 col-span-2">
            <MapPin size={16} className="text-muted" />
            <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-transparent outline-none py-2.5 w-full text-sm font-medium">
              <option value="hyderabad">Hyderabad</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="pune">Pune</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-2 rounded-xl border border-border">
            <span className="text-muted text-sm">🎯</span>
            <select value={sport} onChange={(e) => setSport(e.target.value)} className="bg-transparent outline-none py-2.5 w-full text-sm font-medium">
              <option value="">Any sport</option>
              {sports.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-2 rounded-xl border border-border">
            <CalendarDays size={16} className="text-muted" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none py-2.5 w-full text-sm font-medium" />
          </div>
          <div className="flex items-center gap-2 px-2 rounded-xl border border-border">
            <Clock size={16} className="text-muted" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="bg-transparent outline-none py-2.5 w-full text-sm font-medium" />
          </div>
          <button onClick={go} className="btn-brand col-span-2 md:col-span-1"><Search size={18} /> Find a Turf</button>
        </div>
      </div>
    </div>
  );
}

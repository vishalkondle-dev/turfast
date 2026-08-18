"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { List, Map, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ExploreFilters({ sports, current, count }: { sports: { slug: string; name: string }[]; current: Record<string, string>; count: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  function setParam(key: string, val?: string) {
    const p = new URLSearchParams(params.toString());
    if (val == null || val === "") p.delete(key); else p.set(key, val);
    router.push(`/explore?${p.toString()}`);
  }

  const view = current.view || "list";
  const active = current.sport;

  return (
    <div className="space-y-3">
      {/* sport pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        <button onClick={() => setParam("sport")} className={cn("chip shrink-0", !active && "!bg-brand !text-brand-fg !border-brand")}>All sports</button>
        {sports.map((s) => (
          <button key={s.slug} onClick={() => setParam("sport", s.slug)} className={cn("chip shrink-0", active === s.slug && "!bg-brand !text-brand-fg !border-brand")}>{s.name}</button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setOpen((o) => !o)} className="chip"><SlidersHorizontal size={15} /> Filters</button>
        <select value={current.sort || ""} onChange={(e) => setParam("sort", e.target.value)} className="chip !py-1.5">
          <option value="">Sort: Recommended</option>
          <option value="rating">Top rated</option>
          <option value="price">Lowest price</option>
          <option value="popularity">Most popular</option>
        </select>
        <div className="ml-auto flex items-center rounded-full border border-border overflow-hidden">
          <button onClick={() => setParam("view", "list")} className={cn("px-3 py-1.5 text-sm flex items-center gap-1", view === "list" ? "bg-brand text-brand-fg" : "")}><List size={15} /> List</button>
          <button onClick={() => setParam("view", "map")} className={cn("px-3 py-1.5 text-sm flex items-center gap-1", view === "map" ? "bg-brand text-brand-fg" : "")}><Map size={15} /> Map</button>
        </div>
      </div>

      {open && (
        <div className="card p-4 grid sm:grid-cols-3 gap-4 animate-fade-in">
          <div>
            <label className="label">Max price /hr</label>
            <input type="range" min={300} max={2500} step={100} defaultValue={current.maxPrice || 2500} onChange={(e) => setParam("maxPrice", e.target.value)} className="w-full accent-brand" />
            <div className="text-sm font-semibold">₹{current.maxPrice || 2500}</div>
          </div>
          <div>
            <label className="label">Minimum rating</label>
            <div className="flex gap-1.5 mt-1">
              {[3, 3.5, 4, 4.5].map((r) => (
                <button key={r} onClick={() => setParam("minRating", String(r))} className={cn("chip !py-1", current.minRating === String(r) && "!bg-brand !text-brand-fg")}>{r}★+</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-1.5 mt-1">
              <button onClick={() => setParam("indoor", "1")} className={cn("chip !py-1", current.indoor === "1" && "!bg-brand !text-brand-fg")}>Indoor</button>
              <button onClick={() => setParam("indoor", "0")} className={cn("chip !py-1", current.indoor === "0" && "!bg-brand !text-brand-fg")}>Outdoor</button>
            </div>
          </div>
          <button onClick={() => router.push("/explore")} className="text-sm text-danger flex items-center gap-1 sm:col-span-3"><X size={14} /> Clear all filters · {count} results</button>
        </div>
      )}
    </div>
  );
}

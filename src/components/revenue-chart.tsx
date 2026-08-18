"use client";
import { inr } from "@/lib/format";

/** Lightweight self-contained bar chart (no chart lib needed for this view). */
export function RevenueChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
          <div className="text-[10px] font-semibold text-muted opacity-0 group-hover:opacity-100 transition">{inr(d.value)}</div>
          <div className="w-full rounded-t-lg bg-gradient-to-t from-brand to-accent transition-all" style={{ height: `${Math.max(4, (d.value / max) * 130)}px` }} />
          <div className="text-[11px] text-muted">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

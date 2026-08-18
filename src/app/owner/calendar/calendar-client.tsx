"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { blockSlot, unblockSlot } from "@/app/actions/owner";
import { fmtTime, inr } from "@/lib/format";
import { cn } from "@/lib/utils";

type Res = { id: string; name: string; open: number; close: number; basePrice: number };
type Bk = { id: string; resourceId: string; start: number; end: number; name: string; status: string; code: string };
type Bl = { id: string; resourceId: string; start: number; end: number; reason: string };

export function CalendarClient({ venues, activeVenue, date, resources, bookings, blocks }: { venues: { id: string; name: string }[]; activeVenue: string; date: string; resources: Res[]; bookings: Bk[]; blocks: Bl[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modal, setModal] = useState<null | { resourceId: string; hour: number }>(null);

  const hours = Array.from({ length: 17 }, (_, i) => 6 + i); // 6..22
  function nav(deltaDays: number) {
    const [y, m, d] = date.split("-").map(Number);
    const nd = new Date(y, m - 1, d + deltaDays);
    router.push(`/owner/calendar?venue=${activeVenue}&date=${nd.toISOString().slice(0, 10)}`);
  }
  function cellState(res: Res, hour: number): { type: "free" | "booked" | "blocked"; item?: Bk | Bl } {
    const [y, m, d] = date.split("-").map(Number);
    const cellStart = new Date(y, m - 1, d, hour).getTime();
    const cellEnd = cellStart + 3600000;
    const bk = bookings.find((b) => b.resourceId === res.id && b.start < cellEnd && b.end > cellStart);
    if (bk) return { type: "booked", item: bk };
    const bl = blocks.find((b) => b.resourceId === res.id && b.start < cellEnd && b.end > cellStart);
    if (bl) return { type: "blocked", item: bl };
    return { type: "free" };
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={activeVenue} onChange={(e) => router.push(`/owner/calendar?venue=${e.target.value}&date=${date}`)} className="input max-w-xs">
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => nav(-1)} className="btn-outline !px-2"><ChevronLeft size={16} /></button>
          <input type="date" value={date} onChange={(e) => router.push(`/owner/calendar?venue=${activeVenue}&date=${e.target.value}`)} className="input !py-2" />
          <button onClick={() => nav(1)} className="btn-outline !px-2"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted mb-2">
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-surface-2 inline-block border border-border" /> Free</span>
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-brand inline-block" /> Booked</span>
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-warning inline-block" /> Blocked</span>
        <span className="ml-auto">Tap a free cell to block · a blocked cell to unblock</span>
      </div>

      <div className="card overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${hours.length}, minmax(44px,1fr))` }}>
            <div className="sticky left-0 bg-surface z-10 px-3 py-2 text-xs font-semibold text-muted border-b border-r border-border">Court</div>
            {hours.map((h) => <div key={h} className="px-1 py-2 text-[10px] text-center text-muted border-b border-border">{h}:00</div>)}
            {resources.map((res) => (
              <div key={res.id} className="contents">
                <div className="sticky left-0 bg-surface z-10 px-3 py-2 text-xs font-medium border-b border-r border-border">{res.name}<div className="text-[10px] text-muted">{inr(res.basePrice)}/hr</div></div>
                {hours.map((h) => {
                  const st = cellState(res, h);
                  return (
                    <button key={h} onClick={() => {
                      if (st.type === "blocked") start(async () => { await unblockSlot((st.item as Bl).id); router.refresh(); });
                      else if (st.type === "free") setModal({ resourceId: res.id, hour: h });
                    }} disabled={st.type === "booked"}
                      title={st.type === "booked" ? `${(st.item as Bk).name} · ${(st.item as Bk).code}` : st.type === "blocked" ? (st.item as Bl).reason : "Free"}
                      className={cn("h-9 border-b border-r border-border text-[9px] transition",
                        st.type === "booked" ? "bg-brand/80 text-brand-fg cursor-default" : st.type === "blocked" ? "bg-warning/80 text-white" : "hover:bg-brand/10")}>
                      {st.type === "booked" ? (st.item as Bk).name.split(" ")[0] : st.type === "blocked" ? "×" : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && <BlockModal date={date} resourceId={modal.resourceId} hour={modal.hour} onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh(); }} />}
    </div>
  );
}

function BlockModal({ date, resourceId, hour, onClose, onDone }: { date: string; resourceId: string; hour: number; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("maintenance");
  const [hours, setHours] = useState(1);
  const [pending, start] = useTransition();
  function confirm() {
    const [y, m, d] = date.split("-").map(Number);
    const startMs = new Date(y, m - 1, d, hour).getTime();
    start(async () => { await blockSlot({ resourceId, startMs, endMs: startMs + hours * 3600000, reason }); onDone(); });
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="font-bold text-lg mb-1 flex items-center gap-2"><Ban size={18} /> Block slot</div>
        <p className="text-sm text-muted mb-3">From {fmtTime(new Date(`${date}T${String(hour).padStart(2, "0")}:00`))} · this slot won't be bookable.</p>
        <label className="label">Reason</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="input mt-1 mb-3 capitalize">
          {["maintenance", "cleaning", "private_event", "staff_use", "weather", "repairs"].map((r) => <option key={r} value={r} className="capitalize">{r.replace("_", " ")}</option>)}
        </select>
        <label className="label">Duration (hours)</label>
        <input type="number" min={1} max={6} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="input mt-1 mb-4" />
        <div className="flex gap-2"><button onClick={onClose} className="btn-outline flex-1">Cancel</button><button onClick={confirm} disabled={pending} className="btn-brand flex-1">{pending ? <Loader2 className="animate-spin" size={16} /> : "Block"}</button></div>
      </div>
    </div>
  );
}

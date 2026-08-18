"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui";
import { createCoupon, toggleCoupon } from "@/app/actions/owner";
import { inr } from "@/lib/format";

type C = { id: string; code: string; description: string; type: string; value: number; minAmount: number; usedCount: number; active: boolean; owned: boolean };

export function OffersManager({ coupons }: { coupons: C[] }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ code: "", description: "", type: "percent", value: 10, minAmount: 300, maxDiscount: 200 });

  function create() {
    start(async () => { await createCoupon({ ...form, scope: "all" }); setShow(false); setForm({ code: "", description: "", type: "percent", value: 10, minAmount: 300, maxDiscount: 200 }); router.refresh(); });
  }
  return (
    <div>
      <button onClick={() => setShow((s) => !s)} className="btn-brand mb-4"><Plus size={18} /> New coupon</button>
      {show && (
        <div className="card p-4 mb-4 grid sm:grid-cols-2 gap-3">
          <div><label className="label">Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="input mt-1" /></div>
          <div><label className="label">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input mt-1" /></div>
          <div><label className="label">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input mt-1"><option value="percent">Percent</option><option value="flat">Flat ₹</option></select></div>
          <div><label className="label">Value</label><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="input mt-1" /></div>
          <div><label className="label">Min amount</label><input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })} className="input mt-1" /></div>
          <div><label className="label">Max discount</label><input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} className="input mt-1" /></div>
          <button onClick={create} disabled={pending || !form.code} className="btn-brand sm:col-span-2">{pending ? <Loader2 className="animate-spin" size={16} /> : "Create coupon"}</button>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {coupons.map((c) => (
          <div key={c.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-mono font-bold text-brand">{c.code} {!c.owned && <Badge tone="muted" className="!text-[9px]">platform</Badge>}</div>
              <div className="text-sm text-muted">{c.description}</div>
              <div className="text-xs text-muted mt-1">{c.type === "percent" ? `${c.value}%` : inr(c.value)} · min {inr(c.minAmount)} · used {c.usedCount}×</div>
            </div>
            {c.owned && <ToggleBtn id={c.id} active={c.active} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToggleBtn({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <button onClick={() => start(async () => { await toggleCoupon(id, !active); router.refresh(); })} disabled={pending} className={`chip !py-1 ${active ? "!bg-success/10 !text-success !border-success/30" : ""}`}>{active ? "Active" : "Paused"}</button>;
}

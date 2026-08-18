"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { updateResourcePrice } from "@/app/actions/owner";
import { inr } from "@/lib/format";

type Rule = { label: string; price: number; dayType: string; startHour: number; endHour: number };

export function PricingEditor({ resource, rules }: { resource: { id: string; name: string; basePrice: number }; rules: Rule[] }) {
  const router = useRouter();
  const [price, setPrice] = useState(resource.basePrice);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    start(async () => { await updateResourcePrice(resource.id, price); setSaved(true); setTimeout(() => setSaved(false), 1500); router.refresh(); });
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">{resource.name}</div>
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm">₹</span>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="input !py-1.5 w-24 text-right" />
          <span className="text-muted text-sm">/hr</span>
          <button onClick={save} disabled={pending || price === resource.basePrice} className="btn-brand !py-1.5 !px-3">{pending ? <Loader2 className="animate-spin" size={15} /> : saved ? <Check size={15} /> : "Save"}</button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
        {rules.map((r) => (
          <div key={r.label} className="flex justify-between"><span>{r.label} ({r.startHour}-{r.endHour}h)</span><span className="font-semibold text-fg">{inr(r.price)}</span></div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { submitOnboarding } from "@/app/actions/owner";
import { cn } from "@/lib/utils";

const COVERS = [
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80",
];
const STEPS = ["Business", "Venue", "Sports & amenities", "Courts & pricing", "Payout & submit"];

export function OnboardingWizard({ defaults, cities, localities, sports, amenities }: {
  defaults: { name: string; email: string; phone: string };
  cities: { id: string; name: string }[]; localities: { id: string; cityId: string; name: string }[];
  sports: { id: string; slug: string; name: string }[]; amenities: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({
    businessName: "", contactName: defaults.name, contactPhone: defaults.phone, contactEmail: defaults.email, gstin: "", panNumber: "",
    venueName: "", cityId: cities[0]?.id ?? "", localityId: "", address: "", description: "", isIndoor: false,
    sportSlugs: [] as string[], amenitySlugs: [] as string[], coverImage: COVERS[0],
    resourceName: "Turf 1", basePrice: 1000, sportId: "", bankAccount: "", bankIfsc: "",
  });
  const cityLocalities = useMemo(() => localities.filter((l) => l.cityId === f.cityId), [localities, f.cityId]);
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));
  const toggle = (key: "sportSlugs" | "amenitySlugs", v: string) => setF((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));

  function submit() {
    setErr(null);
    const sportId = sports.find((s) => s.slug === f.sportSlugs[0])?.id ?? sports[0]?.id;
    start(async () => {
      try { const r = await submitOnboarding({ ...f, sportId }); router.push(`/owner`); router.refresh(); }
      catch (e) { setErr((e as Error).message); }
    });
  }

  const canNext = () => {
    if (step === 0) return f.businessName && f.contactPhone;
    if (step === 1) return f.venueName && f.address;
    if (step === 2) return f.sportSlugs.length > 0;
    if (step === 3) return f.resourceName && f.basePrice > 0;
    return true;
  };

  return (
    <div>
      {/* progress */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-brand" : "bg-surface-2")} />
            <div className={cn("text-[10px] mt-1", i === step ? "text-brand font-semibold" : "text-muted")}>{s}</div>
          </div>
        ))}
      </div>

      <div className="card p-5 min-h-[320px]">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg">Business details</h2>
            <Field label="Business name"><input value={f.businessName} onChange={(e) => set("businessName", e.target.value)} className="input" placeholder="Elite Sports Group" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact name"><input value={f.contactName} onChange={(e) => set("contactName", e.target.value)} className="input" /></Field>
              <Field label="Contact phone"><input value={f.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className="input" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GSTIN (optional)"><input value={f.gstin} onChange={(e) => set("gstin", e.target.value)} className="input" /></Field>
              <Field label="PAN (optional)"><input value={f.panNumber} onChange={(e) => set("panNumber", e.target.value)} className="input" /></Field>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg">Venue details</h2>
            <Field label="Venue name"><input value={f.venueName} onChange={(e) => set("venueName", e.target.value)} className="input" placeholder="Elite Arena Gachibowli" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City"><select value={f.cityId} onChange={(e) => set("cityId", e.target.value)} className="input">{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Locality"><select value={f.localityId} onChange={(e) => set("localityId", e.target.value)} className="input"><option value="">Select…</option>{cityLocalities.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
            </div>
            <Field label="Address"><input value={f.address} onChange={(e) => set("address", e.target.value)} className="input" /></Field>
            <Field label="Description"><textarea value={f.description} onChange={(e) => set("description", e.target.value)} className="input h-20 resize-none" /></Field>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isIndoor} onChange={(e) => set("isIndoor", e.target.checked)} className="accent-brand" /> Indoor venue</label>
            </div>
            <Field label="Cover image"><div className="flex gap-2">{COVERS.map((c) => <button key={c} onClick={() => set("coverImage", c)} className={cn("h-12 w-16 rounded-lg bg-cover bg-center border-2", f.coverImage === c ? "border-brand" : "border-transparent")} style={{ backgroundImage: `url(${c})` }} />)}</div></Field>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Sports & amenities</h2>
            <div><div className="label mb-2">Sports offered</div><div className="flex flex-wrap gap-1.5">{sports.map((s) => <button key={s.slug} onClick={() => toggle("sportSlugs", s.slug)} className={cn("chip !py-1", f.sportSlugs.includes(s.slug) && "!bg-brand !text-brand-fg !border-brand")}>{s.name}</button>)}</div></div>
            <div><div className="label mb-2">Amenities</div><div className="flex flex-wrap gap-1.5">{amenities.map((a) => <button key={a.slug} onClick={() => toggle("amenitySlugs", a.slug)} className={cn("chip !py-1", f.amenitySlugs.includes(a.slug) && "!bg-brand !text-brand-fg !border-brand")}>{a.name}</button>)}</div></div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg">Your first court</h2>
            <p className="text-sm text-muted">You can add more courts later. Peak/off-peak rules apply automatically.</p>
            <Field label="Court / turf name"><input value={f.resourceName} onChange={(e) => set("resourceName", e.target.value)} className="input" /></Field>
            <Field label="Primary sport"><select value={f.sportSlugs[0] ?? ""} onChange={(e) => set("sportSlugs", [e.target.value, ...f.sportSlugs.filter((x) => x !== e.target.value)])} className="input">{(f.sportSlugs.length ? sports.filter((s) => f.sportSlugs.includes(s.slug)) : sports).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></Field>
            <Field label="Base price (₹/hour)"><input type="number" value={f.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} className="input" /></Field>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg">Payout details</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bank account"><input value={f.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} className="input" /></Field>
              <Field label="IFSC"><input value={f.bankIfsc} onChange={(e) => set("bankIfsc", e.target.value)} className="input" /></Field>
            </div>
            <div className="bg-surface-2 rounded-xl p-4 text-sm mt-2">
              <div className="font-semibold mb-1">Ready to submit</div>
              <p className="text-muted">Your venue will be listed as <b>Submitted</b> for review. Once approved it goes live for bookings.</p>
            </div>
          </div>
        )}
        {err && <div className="text-sm text-danger mt-3">{err}</div>}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-outline"><ArrowLeft size={16} /> Back</button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="btn-brand">Next <ArrowRight size={16} /></button>
        ) : (
          <button onClick={submit} disabled={pending} className="btn-brand">{pending ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Submit for review</>}</button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label block mb-1">{label}</label>{children}</div>;
}

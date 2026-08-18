"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, Tag, Wallet, Loader2, ShieldCheck, X } from "lucide-react";
import { quoteCheckout, payAndConfirm, type Quote } from "@/app/actions/booking";
import { fmtDateLong, fmtRange, inr } from "@/lib/format";
import { cn } from "@/lib/utils";

type Info = { venue: string; sport: string; resource: string; start: number; end: number; durationMins: number; cover: string };
const METHODS = [{ id: "upi", label: "UPI", icon: "📲" }, { id: "card", label: "Credit / Debit Card", icon: "💳" }, { id: "netbanking", label: "Net Banking", icon: "🏦" }];

export function CheckoutClient({ reservationId, expiresAt, info, initialQuote, walletBalance }: { reservationId: string; expiresAt: number; info: Info; initialQuote: Quote; walletBalance: number }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [useWallet, setUseWallet] = useState(false);
  const [method, setMethod] = useState("upi");
  const [simulate, setSimulate] = useState<"success" | "failure" | "timeout">("success");
  const [secsLeft, setSecs] = useState(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (secsLeft === 0) { setErr("Your slot hold expired."); } }, [secsLeft]);

  async function refreshQuote(nextCoupon?: string, nextWallet?: boolean) {
    setRefreshing(true);
    const q = await quoteCheckout(reservationId, nextCoupon, nextWallet);
    setQuote(q);
    setRefreshing(false);
    return q;
  }

  async function applyCoupon() {
    const q = await refreshQuote(coupon, useWallet);
    if (!q.couponError && q.discount > 0) setAppliedCoupon(coupon.toUpperCase());
  }
  async function removeCoupon() { setCoupon(""); setAppliedCoupon(undefined); await refreshQuote(undefined, useWallet); }
  async function toggleWallet() { const next = !useWallet; setUseWallet(next); await refreshQuote(appliedCoupon, next); }

  function pay() {
    setErr(null);
    start(async () => {
      try {
        const { code } = await payAndConfirm(reservationId, { method, couponCode: appliedCoupon, useWallet, simulate });
        router.push(`/booking/${code}?new=1`);
      } catch (e) { setErr((e as Error).message); }
    });
  }

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Checkout</h1>
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold", secsLeft < 60 ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning")}>
          <Clock size={15} /> {mm}:{ss}
        </div>
      </div>
      <p className="text-muted text-sm -mt-2 mb-4">Your slot is held. Complete payment before the timer runs out.</p>

      <div className="grid md:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          {/* summary */}
          <div className="card overflow-hidden">
            <div className="flex gap-3 p-3">
              <div className="relative h-20 w-24 rounded-xl overflow-hidden shrink-0"><Image src={info.cover} alt={info.venue} fill sizes="96px" className="object-cover" /></div>
              <div>
                <div className="font-bold">{info.venue}</div>
                <div className="text-sm text-muted">{info.sport} · {info.resource}</div>
                <div className="text-sm mt-1">{fmtDateLong(new Date(info.start))}</div>
                <div className="text-sm font-semibold">{fmtRange(new Date(info.start), new Date(info.end))} · {info.durationMins} min</div>
              </div>
            </div>
          </div>

          {/* coupon */}
          <div className="card p-4">
            <div className="label flex items-center gap-1.5 mb-2"><Tag size={14} /> Coupon</div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-success/10 text-success border border-success/20 rounded-lg px-3 py-2 text-sm">
                <span className="font-semibold">{appliedCoupon} applied · saved {inr(quote.discount)}</span>
                <button onClick={removeCoupon}><X size={15} /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Try WELCOME100 / WEEKEND15" className="input" />
                <button onClick={applyCoupon} className="btn-outline">Apply</button>
              </div>
            )}
            {quote.couponError && <div className="text-xs text-danger mt-2">{quote.couponError}</div>}
          </div>

          {/* wallet */}
          <button onClick={toggleWallet} className={cn("card p-4 w-full flex items-center justify-between", useWallet && "border-brand")}>
            <span className="flex items-center gap-2 font-medium"><Wallet size={17} className="text-brand" /> Use wallet balance</span>
            <span className="flex items-center gap-2 text-sm"><span className="text-muted">{inr(walletBalance)} available</span><span className={cn("h-5 w-9 rounded-full relative transition", useWallet ? "bg-brand" : "bg-surface-2")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition", useWallet ? "left-4.5 translate-x-3" : "left-0.5")} /></span></span>
          </button>

          {/* payment methods */}
          <div className="card p-4">
            <div className="label mb-2">Payment method</div>
            <div className="space-y-2">
              {METHODS.map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={cn("w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-sm font-medium transition", method === m.id ? "border-brand bg-brand/5" : "border-border")}>
                  <span className="text-lg">{m.icon}</span> {m.label}
                  <span className={cn("ml-auto h-4 w-4 rounded-full border-2", method === m.id ? "border-brand bg-brand" : "border-border")} />
                </button>
              ))}
            </div>
            {/* demo gateway outcome */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[11px] text-muted mb-1.5">Demo gateway — simulate outcome:</div>
              <div className="flex gap-1.5">
                {(["success", "failure", "timeout"] as const).map((o) => (
                  <button key={o} onClick={() => setSimulate(o)} className={cn("chip !py-1 capitalize", simulate === o && "!bg-brand !text-brand-fg")}>{o}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* price panel */}
        <div className="h-fit md:sticky md:top-20">
          <div className="card p-4">
            <div className="font-bold mb-3">Price details</div>
            <div className={cn("space-y-2 text-sm transition", refreshing && "opacity-50")}>
              <Row label="Slot price" value={inr(quote.base)} />
              {quote.discount > 0 && <Row label="Coupon discount" value={"– " + inr(quote.discount)} tone="text-success" />}
              <Row label="Platform fee" value={inr(quote.platformFee)} />
              {quote.tax > 0 && <Row label="Taxes" value={inr(quote.tax)} />}
              {quote.walletUsed > 0 && <Row label="Wallet" value={"– " + inr(quote.walletUsed)} tone="text-success" />}
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-extrabold text-base"><span>Total payable</span><span>{inr(quote.total)}</span></div>
            </div>
            {err && <div className="mt-3 text-sm bg-danger/10 text-danger border border-danger/20 rounded-lg px-3 py-2">{err}</div>}
            <button onClick={pay} disabled={pending || secsLeft === 0} className="btn-brand w-full mt-4">
              {pending ? <Loader2 className="animate-spin" size={18} /> : <>Pay {inr(quote.total)} & Confirm</>}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted mt-2"><ShieldCheck size={13} /> Secure payment · instant confirmation</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span className={cn("font-semibold", tone)}>{value}</span></div>;
}

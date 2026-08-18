"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Mail, ArrowRight, Loader2, Zap } from "lucide-react";

const DEMOS = [
  { email: "vishal@turfast.test", label: "Customer", emoji: "🎮" },
  { email: "owner@turfast.test", label: "Venue Owner", emoji: "🏟️" },
  { email: "staff@turfast.test", label: "Staff", emoji: "🧑‍💼" },
  { email: "admin@turfast.test", label: "Admin", emoji: "🛡️" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null); setLoading(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setLoading(false);
    if (error) return setErr(error.message || "Could not send code.");
    setStage("otp");
    // dev: surface the code
    try {
      const r = await fetch(`/api/dev/otp?email=${encodeURIComponent(email)}`);
      const d = await r.json();
      if (d.code) setMsg(`Dev mode — your code is ${d.code}`);
    } catch {}
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null); setLoading(true);
    const { error } = await authClient.signIn.emailOtp({ email, otp });
    setLoading(false);
    if (error) return setErr(error.message || "Invalid code.");
    router.push("/");
    router.refresh();
  }

  async function quickLogin(demoEmail: string) {
    setErr(null); setLoading(true);
    const r = await fetch("/api/dev/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: demoEmail }) });
    setLoading(false);
    if (!r.ok) return setErr("Quick login failed.");
    // route by role
    const dest = demoEmail.startsWith("owner") ? "/owner" : demoEmail.startsWith("staff") ? "/staff" : demoEmail.startsWith("admin") ? "/admin" : "/";
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {stage === "email" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <label className="label">Email address</label>
          <div className="flex items-center gap-2 input">
            <Mail size={18} className="text-muted" />
            <input autoFocus type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="bg-transparent outline-none w-full" />
          </div>
          <button className="btn-brand w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={18} /> : <>Send code <ArrowRight size={18} /></>}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <label className="label">Enter the 6-digit code sent to {email}</label>
          <input autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="input text-center text-2xl tracking-[.5em] font-bold" />
          <button className="btn-brand w-full" disabled={loading || otp.length < 6}>{loading ? <Loader2 className="animate-spin" size={18} /> : "Verify & sign in"}</button>
          <button type="button" onClick={() => setStage("email")} className="text-sm text-muted w-full text-center">Use a different email</button>
        </form>
      )}

      {msg && <div className="text-sm bg-accent/10 text-accent border border-accent/20 rounded-lg px-3 py-2">{msg}</div>}
      {err && <div className="text-sm bg-danger/10 text-danger border border-danger/20 rounded-lg px-3 py-2">{err}</div>}

      <div className="relative py-1"><div className="border-t border-border" /><span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-surface px-2 text-xs text-muted">or explore instantly</span></div>
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-2"><Zap size={13} /> One-click demo accounts</div>
        <div className="grid grid-cols-2 gap-2">
          {DEMOS.map((d) => (
            <button key={d.email} onClick={() => quickLogin(d.email)} disabled={loading} className="btn-outline !py-2.5 justify-start text-sm">
              <span>{d.emoji}</span> {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

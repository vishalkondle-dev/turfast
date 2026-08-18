"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupportTicket } from "@/app/actions/misc";

export function SupportForm() {
  const router = useRouter();
  const [category, setCategory] = useState("booking");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  function submit() {
    start(async () => { const r = await createSupportTicket({ category, subject, body }); setDone(r.code); setSubject(""); setBody(""); router.refresh(); });
  }
  return (
    <div className="card p-4 space-y-3">
      {done && <div className="text-sm bg-success/10 text-success rounded-lg px-3 py-2">Ticket {done} created. We'll be in touch!</div>}
      <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
        {["booking", "payment", "refund", "venue", "game", "account", "other"].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
      </select>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="input" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your issue…" className="input h-24 resize-none" />
      <button onClick={submit} disabled={pending || !subject || !body} className="btn-brand w-full">{pending ? <Loader2 className="animate-spin" size={16} /> : "Submit ticket"}</button>
    </div>
  );
}

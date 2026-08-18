"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { resolveDispute } from "@/app/actions/admin";
import { fmtDate } from "@/lib/format";

type D = { id: string; code: string; reason: string; detail: string; status: string; resolution?: string | null; user: string; created: number };
const TONE: Record<string, string> = { open: "danger", under_investigation: "warning", awaiting_response: "warning", resolved: "success", closed: "muted" };

export function DisputeCard({ d }: { d: D }) {
  const router = useRouter();
  const [text, setText] = useState(d.resolution ?? "");
  const [pending, start] = useTransition();
  const open = d.status !== "resolved" && d.status !== "closed";

  function submit(status: "resolved" | "under_investigation") {
    start(async () => { await resolveDispute(d.id, text, status); router.refresh(); });
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div><span className="font-mono text-sm font-bold">{d.code}</span> <span className="text-muted text-sm">· {d.user} · {fmtDate(new Date(d.created))}</span></div>
        <Badge tone={TONE[d.status] as any}>{d.status.replace("_", " ")}</Badge>
      </div>
      <div className="text-sm mt-1"><Badge tone="muted" className="capitalize">{d.reason.replace("_", " ")}</Badge></div>
      <p className="text-sm text-muted mt-2">{d.detail}</p>
      {open ? (
        <div className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Resolution note…" className="input" />
          <button onClick={() => submit("under_investigation")} disabled={pending} className="btn-outline !px-3 text-warning text-sm">Investigating</button>
          <button onClick={() => submit("resolved")} disabled={pending || !text} className="btn-brand !px-3">{pending ? <Loader2 className="animate-spin" size={15} /> : "Resolve"}</button>
        </div>
      ) : d.resolution ? <div className="mt-2 text-sm bg-surface-2 rounded-lg p-2.5"><span className="font-semibold text-brand">Resolution:</span> {d.resolution}</div> : null}
    </div>
  );
}

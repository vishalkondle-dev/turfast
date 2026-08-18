"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyReferral({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="mt-3 w-full flex items-center justify-between border-2 border-dashed border-brand rounded-xl px-4 py-3 font-mono font-bold text-brand text-lg">
      {code}
      <span className="text-sm flex items-center gap-1 font-sans">{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}</span>
    </button>
  );
}

"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { replyToReview } from "@/app/actions/owner";

export function ReviewReply({ reviewId, existing }: { reviewId: string; existing?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(existing ?? "");
  const [pending, start] = useTransition();

  if (existing && !open) return (
    <div className="mt-2 bg-surface-2 rounded-lg p-2.5 text-sm"><span className="font-semibold text-brand">Your reply:</span> {existing} <button onClick={() => setOpen(true)} className="text-xs text-muted ml-2 underline">edit</button></div>
  );
  if (!open) return <button onClick={() => setOpen(true)} className="btn-outline !py-1.5 !text-xs mt-2">Reply</button>;
  return (
    <div className="mt-2 flex gap-2">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" className="input" />
      <button onClick={() => start(async () => { await replyToReview(reviewId, text); setOpen(false); router.refresh(); })} disabled={pending || !text} className="btn-brand !px-3">{pending ? <Loader2 className="animate-spin" size={15} /> : "Post"}</button>
    </div>
  );
}

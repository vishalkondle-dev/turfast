"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  setUserStatus, approveOwner, moderateReview, markPayoutPaid, updateSupportTicket, resolveDispute,
} from "@/app/actions/admin";
import { cn } from "@/lib/utils";

type Kind = "user" | "owner" | "review" | "payout" | "ticket";

export function ActionBtn({ kind, id, arg, label, tone = "brand", small }: { kind: Kind; id: string; arg?: string; label: string; tone?: string; small?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function run() {
    start(async () => {
      if (kind === "user") await setUserStatus(id, arg as any);
      else if (kind === "owner") await approveOwner(id, arg as any);
      else if (kind === "review") await moderateReview(id, arg as any);
      else if (kind === "payout") await markPayoutPaid(id);
      else if (kind === "ticket") await updateSupportTicket(id, arg as any);
      router.refresh();
    });
  }
  const toneCls = tone === "danger" ? "text-danger border-danger/30" : tone === "success" ? "text-success border-success/30" : tone === "warning" ? "text-warning border-warning/30" : "text-brand border-brand/30";
  return (
    <button onClick={run} disabled={pending} className={cn("chip", small && "!py-1 !text-xs", toneCls)}>
      {pending ? <Loader2 className="animate-spin" size={13} /> : label}
    </button>
  );
}

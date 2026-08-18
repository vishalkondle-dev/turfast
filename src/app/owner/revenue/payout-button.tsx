"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
import { requestPayout } from "@/app/actions/owner";
import { inr } from "@/lib/format";

export function PayoutButton({ available }: { available: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(async () => { await requestPayout(available); router.refresh(); })} disabled={pending || available <= 0} className="btn-brand">
      {pending ? <Loader2 className="animate-spin" size={18} /> : <><Wallet size={18} /> Request payout of {inr(available)}</>}
    </button>
  );
}

"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { markAllNotificationsRead } from "@/app/actions/misc";

export function MarkReadButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(async () => { await markAllNotificationsRead(); router.refresh(); })} disabled={pending} className="btn-ghost text-sm text-brand">
      <CheckCheck size={16} /> Mark all read
    </button>
  );
}

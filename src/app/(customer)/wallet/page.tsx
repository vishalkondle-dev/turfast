import { requireUser } from "@/lib/session";
import { getWallet } from "@/lib/queries";
import { EmptyState, Stat } from "@/components/ui";
import { inr, fmtDate } from "@/lib/format";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const user = await requireUser();
  const { wallet, txns } = await getWallet(user.id);
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Wallet</h1>
      <div className="card p-6 bg-gradient-to-br from-brand to-accent text-white">
        <div className="flex items-center gap-2 text-white/85"><WalletIcon size={18} /> Available balance</div>
        <div className="text-4xl font-extrabold mt-1">{inr(wallet?.balance ?? 0)}</div>
        <p className="text-white/80 text-sm mt-2">Use your balance at checkout. Refunds & rewards land here automatically.</p>
      </div>
      <h2 className="font-bold mt-6 mb-3">Transaction history</h2>
      {txns.length === 0 ? (
        <EmptyState icon="💳" title="No transactions yet" hint="Refunds, cashback and rewards will show up here." />
      ) : (
        <div className="card divide-y divide-border overflow-hidden">
          {txns.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
              <span className={`h-9 w-9 rounded-lg grid place-items-center ${tx.amount >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                {tx.amount >= 0 ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
              </span>
              <div className="flex-1">
                <div className="font-medium text-sm capitalize">{tx.note || tx.type}</div>
                <div className="text-xs text-muted">{fmtDate(new Date(+tx.createdAt))}</div>
              </div>
              <div className={`font-bold ${tx.amount >= 0 ? "text-success" : ""}`}>{tx.amount >= 0 ? "+" : "–"}{inr(Math.abs(tx.amount))}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

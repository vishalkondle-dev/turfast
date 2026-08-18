"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button onClick={async () => { await signOut(); router.push("/login"); router.refresh(); }} className="btn-outline w-full text-danger">
      <LogOut size={16} /> Sign out
    </button>
  );
}

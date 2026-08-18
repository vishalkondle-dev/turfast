"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/misc";

export function FavoriteButton({ venueId, loggedIn, initial = false }: { venueId: string; loggedIn: boolean; initial?: boolean }) {
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  function click() {
    if (!loggedIn) return router.push("/login");
    setFav((f) => !f);
    start(async () => { await toggleFavorite(venueId); });
  }
  return (
    <button onClick={click} disabled={pending} className="btn-outline !px-3" aria-label="Favorite">
      <Heart size={16} className={fav ? "fill-danger text-danger" : ""} />
    </button>
  );
}

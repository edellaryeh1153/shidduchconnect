"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Props = {
  profileId: string;
  size?: "sm" | "md";
};

export default function FavoriteButton({ profileId, size = "md" }: Props) {
  const { appUser } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;
    async function check() {
      const { data } = await supabase.from("favorites")
        .select("id").eq("user_id", appUser!.id).eq("profile_id", profileId).single();
      setIsFav(!!data);
      setLoading(false);
    }
    check();
  }, [appUser, profileId]);

  async function toggle() {
    if (!appUser) return;
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", appUser.id).eq("profile_id", profileId);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: appUser.id, profile_id: profileId });
      setIsFav(true);
    }
  }

  if (loading) return null;

  return (
    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      className={`transition-all ${size === "sm" ? "text-base" : "text-xl"} ${isFav ? "text-[#C4956A]" : "text-gray-300 hover:text-[#C4956A]"}`}
      title={isFav ? "Remove from watchlist" : "Add to watchlist"}>
      {isFav ? "★" : "☆"}
    </button>
  );
}
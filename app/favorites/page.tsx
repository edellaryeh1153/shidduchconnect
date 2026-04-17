"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import FavoriteButton from "@/components/FavoriteButton";

export default function FavoritesPage() {
  const { appUser } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;
    async function load() {
      const { data: favs } = await supabase.from("favorites").select("profile_id").eq("user_id", appUser!.id);
      const ids = (favs || []).map((f: any) => f.profile_id);
      if (ids.length > 0) {
        const { data } = await supabase.from("profiles").select("*").in("id", ids);
        setProfiles(data || []);
      }
      setLoading(false);
    }
    load();
  }, [appUser]);

  const girls = profiles.filter((p) => p.gender === "Girl");
  const boys = profiles.filter((p) => p.gender === "Boy");

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        ★ My Watchlist
      </h1>
      <p className="text-sm text-gray-500 mb-6">Profiles you've starred for quick access.</p>

      {loading ? <p className="text-gray-400">Loading...</p> : profiles.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <div className="text-4xl mb-3 text-gray-300">☆</div>
          <p className="text-gray-500 mb-2">No favorites yet</p>
          <p className="text-sm text-gray-400">Click the star icon on any profile to add it to your watchlist.</p>
          <Link href="/profiles" className="inline-block mt-4 px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm hover:bg-[#244E63]">Browse Profiles</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-[#C4956A] mb-3 border-b border-[#C4956A]/20 pb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Girls ({girls.length})
            </h2>
            <div className="space-y-3">
              {girls.map((p) => (
                <Link key={p.id} href={`/profiles/${p.id}`} className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C4956A] flex items-center justify-center text-white font-semibold shrink-0">
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1B3A4B]">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.age} · {p.hashkafa} · {p.city}</div>
                    </div>
                  </div>
                  <FavoriteButton profileId={p.id} size="sm" />
                </Link>
              ))}
              {girls.length === 0 && <p className="text-gray-400 text-sm">No girls in watchlist.</p>}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1B3A4B] mb-3 border-b border-[#1B3A4B]/20 pb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Boys ({boys.length})
            </h2>
            <div className="space-y-3">
              {boys.map((p) => (
                <Link key={p.id} href={`/profiles/${p.id}`} className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1B3A4B] flex items-center justify-center text-white font-semibold shrink-0">
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[#1B3A4B]">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.age} · {p.hashkafa} · {p.city}</div>
                    </div>
                  </div>
                  <FavoriteButton profileId={p.id} size="sm" />
                </Link>
              ))}
              {boys.length === 0 && <p className="text-gray-400 text-sm">No boys in watchlist.</p>}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
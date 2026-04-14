"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth, canDo } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { HASHKAFOS } from "@/types";

export default function ProfilesPage() {
  const { appUser } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHashkafa, setFilterHashkafa] = useState("");
  const [filterAgeMin, setFilterAgeMin] = useState("");
  const [filterAgeMax, setFilterAgeMax] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const profs = data || [];
      setProfiles(profs);

      // Load photos for profiles that have them
      const withPhotos = profs.filter((p) => p.photo_url);
      const urls: Record<string, string> = {};
      await Promise.all(
        withPhotos.map(async (p) => {
          const { data: signed } = await supabase.storage.from("photos").createSignedUrl(p.photo_url, 3600);
          if (signed?.signedUrl) urls[p.id] = signed.signedUrl;
        })
      );
      setPhotoUrls(urls);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = profiles.filter((p) => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) && !p.city?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterHashkafa && p.hashkafa !== filterHashkafa) return false;
    if (filterAgeMin && (p.age || 0) < parseInt(filterAgeMin)) return false;
    if (filterAgeMax && (p.age || 99) > parseInt(filterAgeMax)) return false;
    return true;
  });

  const girls = filtered.filter((p) => p.gender === "Girl" || p.gender === "girl");
  const boys = filtered.filter((p) => p.gender === "Boy" || p.gender === "boy");

  function ProfileCard({ p }: { p: any }) {
    const isGirl = p.gender === "Girl" || p.gender === "girl";
    const photo = photoUrls[p.id];
    return (
      <Link href={`/profiles/${p.id}`} className="block bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div className="flex items-center gap-3 mb-2">
          {photo ? (
            <img src={photo} alt={p.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0" />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${isGirl ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
              {p.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-[#1B3A4B] truncate">{p.name}</div>
            <div className="text-xs text-gray-500">{p.age ? `${p.age} yrs` : ""}{p.hashkafa ? ` · ${p.hashkafa}` : ""}</div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {p.height && <span>{p.height} · </span>}
          {p.city}{p.state && `, ${p.state}`}
          {p.occupation && ` · ${p.occupation}`}
        </div>
        {p.learning_status && <div className="text-xs text-gray-400 mt-1">{p.learning_status}</div>}
        {p.personality_traits?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {p.personality_traits.slice(0, 3).map((t: string) => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500">{t}</span>
            ))}
            {p.personality_traits.length > 3 && <span className="text-[10px] text-gray-400">+{p.personality_traits.length - 3}</span>}
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-400">
            {p.profile_visibility === "private" ? "🔒 Private" : p.profile_visibility === "shared" ? "👥 Shared" : "🏢 Org"}
          </span>
          {p.ready_to_date && p.ready_to_date !== "Yes" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{p.ready_to_date}</span>
          )}
          {p.resume_url && <span className="text-[10px] text-gray-400">📄 Resume</span>}
        </div>
      </Link>
    );
  }

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Profiles</h1>
        {canDo(appUser, "create") && (
          <Link href="/profiles/new" className="px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63] transition-colors">+ Add Profile</Link>
        )}
      </div>
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6 flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or city..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]" />
        </div>
        <div className="w-[180px]">
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Hashkafa</label>
          <select value={filterHashkafa} onChange={(e) => setFilterHashkafa(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
            <option value="">All</option>
            {HASHKAFOS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="w-[100px]">
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Age min</label>
          <input type="number" value={filterAgeMin} onChange={(e) => setFilterAgeMin(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]" />
        </div>
        <div className="w-[100px]">
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Age max</label>
          <input type="number" value={filterAgeMax} onChange={(e) => setFilterAgeMax(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]" />
        </div>
      </div>
      {loading ? <p className="text-gray-400">Loading profiles...</p> : (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-[#C4956A] mb-3 border-b border-[#C4956A]/20 pb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Girls ({girls.length})
            </h2>
            <div className="space-y-3">
              {girls.map((p) => <ProfileCard key={p.id} p={p} />)}
              {girls.length === 0 && <p className="text-gray-400 text-sm">No girls found.</p>}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1B3A4B] mb-3 border-b border-[#1B3A4B]/20 pb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Boys ({boys.length})
            </h2>
            <div className="space-y-3">
              {boys.map((p) => <ProfileCard key={p.id} p={p} />)}
              {boys.length === 0 && <p className="text-gray-400 text-sm">No boys found.</p>}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
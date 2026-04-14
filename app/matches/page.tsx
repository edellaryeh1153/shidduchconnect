"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth, canDo } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { STATUS_COLORS } from "@/types";

export default function MatchesPage() {
  const { appUser } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [boys, setBoys] = useState<any[]>([]);
  const [girls, setGirls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [boyId, setBoyId] = useState("");
  const [girlId, setGirlId] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const [mRes, pRes] = await Promise.all([
      supabase.from("matches").select("*, boy_profile:profiles!boy_profile_id(name, age, hashkafa), girl_profile:profiles!girl_profile_id(name, age, hashkafa), match_notes(id)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name, gender, age, hashkafa"),
    ]);
    setMatches(mRes.data || []);
    const profiles = pRes.data || [];
    setBoys(profiles.filter((p: any) => p.gender === "Boy" || p.gender === "boy"));
    setGirls(profiles.filter((p: any) => p.gender === "Girl" || p.gender === "girl"));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!boyId || !girlId || !appUser) return;
    setCreating(true);
    const { error } = await supabase.from("matches").insert({
      boy_profile_id: boyId, girl_profile_id: girlId, created_by: appUser.id,
    });
    if (!error && note.trim()) {
      const { data: newMatch } = await supabase.from("matches").select("id").eq("boy_profile_id", boyId).eq("girl_profile_id", girlId).order("created_at", { ascending: false }).limit(1).single();
      if (newMatch) {
        await supabase.from("match_notes").insert({ match_id: newMatch.id, author_id: appUser.id, note_text: note.trim() });
      }
    }
    await supabase.from("audit_log").insert({ user_id: appUser.id, action: "created_match", details: { boy: boyId, girl: girlId } });
    setBoyId(""); setGirlId(""); setNote(""); setCreating(false);
    load();
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Matches</h1>
      {canDo(appUser, "match") && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Create New Match</h2>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Boy</label>
              <select value={boyId} onChange={(e) => setBoyId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
                <option value="">Choose...</option>
                {boys.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.age}, {b.hashkafa})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Girl</label>
              <select value={girlId} onChange={(e) => setGirlId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
                <option value="">Choose...</option>
                {girls.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.age}, {g.hashkafa})</option>)}
              </select>
            </div>
            <button onClick={handleCreate} disabled={!boyId || !girlId || creating} className="px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63] disabled:opacity-50 transition-colors">
              {creating ? "Creating..." : "Create Match"}
            </button>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Initial Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this match?" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]" />
          </div>
        </div>
      )}
      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-2">
          {matches.length === 0 && <p className="text-gray-400">No matches yet.</p>}
          {matches.map((m) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[m.status] || "#888" }} />
                <div>
                  <span className="font-semibold text-[#1B3A4B]">{m.boy_profile?.name}</span>
                  <span className="text-gray-400 mx-2">&</span>
                  <span className="font-semibold text-[#C4956A]">{m.girl_profile?.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-3 py-1 rounded-full text-white" style={{ background: STATUS_COLORS[m.status] || "#888" }}>{m.status}</span>
                <span className="text-xs text-gray-400">{m.match_notes?.length || 0} notes</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
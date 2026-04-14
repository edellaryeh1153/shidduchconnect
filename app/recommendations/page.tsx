"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { computeScore } from "@/lib/scoring";

export default function RecommendationsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [p, m] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("matches").select("boy_profile_id, girl_profile_id"),
      ]);
      setProfiles(p.data || []);
      setMatches(m.data || []);
    }
    load();
  }, []);

  function selectProfile(id: string) {
    const prof = profiles.find((p) => p.id === id);
    if (!prof) { setSelected(null); setRecs([]); return; }
    setSelected(prof);
    const existingIds = matches
      .filter((m) => m.boy_profile_id === id || m.girl_profile_id === id)
      .map((m) => m.boy_profile_id === id ? m.girl_profile_id : m.boy_profile_id);
    const candidates = profiles
      .filter((p) => {
        const pGender = p.gender?.toLowerCase();
        const profGender = prof.gender?.toLowerCase();
        return pGender !== profGender && !existingIds.includes(p.id);
      })
      .map((c) => {
        const fwd = computeScore(prof, c);
        const rev = computeScore(c, prof);
        return { ...c, fwd, rev, combined: Math.round((fwd + rev) / 2) };
      })
      .sort((a, b) => b.combined - a.combined);
    setRecs(candidates);
  }

  const boys = profiles.filter((p) => p.gender === "Boy" || p.gender === "boy");
  const girls = profiles.filter((p) => p.gender === "Girl" || p.gender === "girl");

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Recommendations</h1>
      <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
        <p className="text-sm text-gray-500 mb-3">Select a profile to see ranked compatible matches based on preferences.</p>
        <select value={selected?.id || ""} onChange={(e) => selectProfile(e.target.value)} className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
          <option value="">Choose a profile...</option>
          <optgroup label="Girls">{girls.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</optgroup>
          <optgroup label="Boys">{boys.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>
        </select>
      </div>
      {selected && (
        <div>
          <h2 className="text-xl font-semibold text-[#1B3A4B] mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            For {selected.name} ({selected.gender}, {selected.age || "?"})
          </h2>
          {recs.length === 0 && <p className="text-gray-400">No candidates available. Add more profiles of the opposite gender.</p>}
          <div className="space-y-3">
            {recs.map((c) => (
              <div key={c.id} className="bg-white rounded-lg p-4 border border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${c.gender === "Girl" || c.gender === "girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                    {c.name?.[0]}
                  </div>
                  <div>
                    <Link href={`/profiles/${c.id}`} className="font-semibold text-[#1B3A4B] hover:underline">{c.name}</Link>
                    <div className="text-xs text-gray-500">{c.age && `${c.age} · `}{c.height && `${c.height} · `}{c.hashkafa}{c.city && ` · ${c.city}`}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Their fit: {c.fwd}% · Reverse: {c.rev}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: c.combined >= 70 ? "#5C8A5C" : c.combined >= 40 ? "#C4956A" : "#A0736C", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {c.combined}%
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Match</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
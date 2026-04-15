"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { SCHOOLS_GIRL, SCHOOLS_BOY } from "@/types";

export default function ComparePage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [left, setLeft] = useState<any>(null);
  const [right, setRight] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").order("name");
      setProfiles(data || []);
    }
    load();
  }, []);

  useEffect(() => {
    setLeft(profiles.find((p) => p.id === leftId) || null);
  }, [leftId, profiles]);

  useEffect(() => {
    setRight(profiles.find((p) => p.id === rightId) || null);
  }, [rightId, profiles]);

  const boys = profiles.filter((p) => p.gender === "Boy" || p.gender === "boy");
  const girls = profiles.filter((p) => p.gender === "Girl" || p.gender === "girl");

  function Field({ label, l, r }: { label: string; l: any; r: any }) {
    if (!l && !r) return null;
    const match = l && r && String(l).toLowerCase() === String(r).toLowerCase();
    return (
      <div className="grid grid-cols-[140px_1fr_1fr] gap-3 py-2 border-b border-gray-100 last:border-0">
        <div className="text-xs text-gray-400 uppercase tracking-wider self-center">{label}</div>
        <div className={`text-sm ${match ? "text-green-700 font-medium" : "text-gray-700"}`}>{l || "—"}</div>
        <div className={`text-sm ${match ? "text-green-700 font-medium" : "text-gray-700"}`}>{r || "—"}</div>
      </div>
    );
  }

  function TraitCompare({ l, r }: { l: string[]; r: string[] }) {
    if ((!l || l.length === 0) && (!r || r.length === 0)) return null;
    const allTraits = [...new Set([...(l || []), ...(r || [])])];
    return (
      <div className="grid grid-cols-[140px_1fr_1fr] gap-3 py-2 border-b border-gray-100">
        <div className="text-xs text-gray-400 uppercase tracking-wider self-start pt-1">Personality</div>
        <div className="flex flex-wrap gap-1">
          {(l || []).map((t) => (
            <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] ${(r || []).includes(t) ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600"}`}>{t}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {(r || []).map((t) => (
            <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] ${(l || []).includes(t) ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600"}`}>{t}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Quick Compare</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Profile 1</label>
          <select value={leftId} onChange={(e) => setLeftId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
            <option value="">Select...</option>
            <optgroup label="Girls">{girls.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.age}, {g.hashkafa})</option>)}</optgroup>
            <optgroup label="Boys">{boys.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.age}, {b.hashkafa})</option>)}</optgroup>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Profile 2</label>
          <select value={rightId} onChange={(e) => setRightId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
            <option value="">Select...</option>
            <optgroup label="Girls">{girls.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.age}, {g.hashkafa})</option>)}</optgroup>
            <optgroup label="Boys">{boys.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.age}, {b.hashkafa})</option>)}</optgroup>
          </select>
        </div>
      </div>

      {left && right ? (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          {/* Headers */}
          <div className="grid grid-cols-[140px_1fr_1fr] gap-3 pb-4 mb-4 border-b-2 border-gray-200">
            <div></div>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${left.gender === "Girl" || left.gender === "girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                {left.name?.[0]}
              </div>
              <div>
                <div className="font-semibold text-[#1B3A4B]">{left.name}</div>
                <div className="text-xs text-gray-500">{left.gender}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${right.gender === "Girl" || right.gender === "girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                {right.name?.[0]}
              </div>
              <div>
                <div className="font-semibold text-[#1B3A4B]">{right.name}</div>
                <div className="text-xs text-gray-500">{right.gender}</div>
              </div>
            </div>
          </div>

          <Field label="Age" l={left.age} r={right.age} />
          <Field label="Height" l={left.height} r={right.height} />
          <Field label="Hashkafa" l={left.hashkafa} r={right.hashkafa} />
          <Field label="Learning" l={left.learning_status} r={right.learning_status} />
          <Field label="City" l={left.city} r={right.city} />
          <Field label="State" l={left.state} r={right.state} />
          <Field label="Where to Live" l={left.where_to_live} r={right.where_to_live} />
          <Field label="Occupation" l={left.occupation} r={right.occupation} />
          <Field label="Hair" l={left.hair_color} r={right.hair_color} />
          <Field label="Eyes" l={left.eye_color} r={right.eye_color} />
          <Field label="Build" l={left.build} r={right.build} />
          <Field label="Smoking" l={left.smoking} r={right.smoking} />
          <Field label="Shul" l={left.shul} r={right.shul} />
          <Field label="Rav" l={left.rav} r={right.rav} />
          <Field label="Camp" l={left.camp} r={right.camp} />
          <Field label="Siblings" l={left.num_siblings != null ? `${left.num_siblings} (${left.position_in_family || ""})` : null} r={right.num_siblings != null ? `${right.num_siblings} (${right.position_in_family || ""})` : null} />
          <Field label="Ready" l={left.ready_to_date} r={right.ready_to_date} />
          <TraitCompare l={left.personality_traits} r={right.personality_traits} />

          {/* About comparison */}
          {(left.about || right.about) && (
            <div className="grid grid-cols-[140px_1fr_1fr] gap-3 py-3 border-t border-gray-200 mt-2">
              <div className="text-xs text-gray-400 uppercase tracking-wider self-start pt-1">About</div>
              <div className="text-xs text-gray-600 whitespace-pre-wrap">{left.about || "—"}</div>
              <div className="text-xs text-gray-600 whitespace-pre-wrap">{right.about || "—"}</div>
            </div>
          )}
          {(left.looking_for_description || right.looking_for_description) && (
            <div className="grid grid-cols-[140px_1fr_1fr] gap-3 py-3 border-t border-gray-100">
              <div className="text-xs text-gray-400 uppercase tracking-wider self-start pt-1">Looking For</div>
              <div className="text-xs text-gray-600 whitespace-pre-wrap">{left.looking_for_description || "—"}</div>
              <div className="text-xs text-gray-600 whitespace-pre-wrap">{right.looking_for_description || "—"}</div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">Green highlights = matching fields</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <p className="text-gray-400">Select two profiles above to compare them side by side.</p>
        </div>
      )}
    </AppShell>
  );
}
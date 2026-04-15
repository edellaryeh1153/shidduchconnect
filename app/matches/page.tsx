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
  const [showCreate, setShowCreate] = useState(false);
  const [boyId, setBoyId] = useState("");
  const [girlId, setGirlId] = useState("");
  const [contactedFirst, setContactedFirst] = useState("boy");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("active");

  async function load() {
    const [mRes, pRes] = await Promise.all([
      supabase.from("matches").select("*, boy_profile:profiles!boy_profile_id(name, age, hashkafa, city), girl_profile:profiles!girl_profile_id(name, age, hashkafa, city), match_notes(id), scheduled_dates(id, status)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name, gender, age, hashkafa, city"),
    ]);
    setMatches(mRes.data || []);
    const profiles = pRes.data || [];
    setBoys(profiles.filter((p: any) => p.gender === "Boy"));
    setGirls(profiles.filter((p: any) => p.gender === "Girl"));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!boyId || !girlId || !appUser) return;
    setCreating(true);
    const initialStatus = contactedFirst === "boy" ? "Sent to Boy Side" : "Sent to Girl Side";
    const { data: newMatch, error } = await supabase.from("matches").insert({
      boy_profile_id: boyId, girl_profile_id: girlId, created_by: appUser.id,
      status: initialStatus, contacted_first: contactedFirst,
    }).select().single();

    if (!error && newMatch && note.trim()) {
      await supabase.from("match_notes").insert({ match_id: newMatch.id, author_id: appUser.id, note_text: note.trim() });
    }
    await supabase.from("audit_log").insert({ user_id: appUser.id, action: "created_match", details: { boy: boyId, girl: girlId, contacted_first: contactedFirst } });
    setBoyId(""); setGirlId(""); setNote(""); setContactedFirst("boy"); setCreating(false); setShowCreate(false);
    load();
  }

  const filtered = matches.filter((m) => {
    if (filterStatus === "active") return !["Ended", "Married", "Boy Said No", "Girl Said No"].includes(m.status);
    if (filterStatus === "ended") return ["Ended", "Boy Said No", "Girl Said No"].includes(m.status);
    if (filterStatus === "success") return ["Engaged", "Married"].includes(m.status);
    return true;
  });

  const statusSteps = (status: string) => {
    const steps = ["Suggested", "Sent", "Response", "Both Agreed", "Dating", "Engaged", "Married"];
    const map: Record<string, number> = {
      "Suggested": 0, "Sent to Boy Side": 1, "Sent to Girl Side": 1,
      "Boy Said Yes": 2, "Girl Said Yes": 2, "Boy Said No": 2, "Girl Said No": 2,
      "Both Agreed": 3, "Dating": 4, "Engaged": 5, "Married": 6, "Ended": -1,
    };
    return map[status] ?? 0;
  };

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Matches</h1>
        {canDo(appUser, "match") && (
          <button onClick={() => setShowCreate(!showCreate)} className="px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63] transition-colors">
            {showCreate ? "Cancel" : "+ New Shidduch"}
          </button>
        )}
      </div>

      {/* Create Match Form */}
      {showCreate && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Start a New Shidduch</h2>
          <p className="text-xs text-gray-500 mb-4">Select a boy and girl, choose who to contact first, and the process begins.</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Boy</label>
              <select value={boyId} onChange={(e) => setBoyId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
                <option value="">Choose a boy...</option>
                {boys.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.age} · {b.hashkafa} · {b.city}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Girl</label>
              <select value={girlId} onChange={(e) => setGirlId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
                <option value="">Choose a girl...</option>
                {girls.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.age} · {g.hashkafa} · {g.city}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Who are you contacting first?</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setContactedFirst("boy")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border-2 transition-colors ${contactedFirst === "boy" ? "bg-[#1B3A4B] text-white border-[#1B3A4B]" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}>
                Boy Side First
              </button>
              <button type="button" onClick={() => setContactedFirst("girl")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border-2 transition-colors ${contactedFirst === "girl" ? "bg-[#C4956A] text-white border-[#C4956A]" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}>
                Girl Side First
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Initial Notes (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why do you think this could work? Any context..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] min-h-[60px]" />
          </div>

          <button onClick={handleCreate} disabled={!boyId || !girlId || creating}
            className="px-6 py-2.5 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63] disabled:opacity-50 transition-colors">
            {creating ? "Creating..." : "Start Shidduch Process"}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "active", label: "Active", count: matches.filter((m) => !["Ended", "Married", "Boy Said No", "Girl Said No"].includes(m.status)).length },
          { key: "all", label: "All", count: matches.length },
          { key: "success", label: "Engagements & Marriages", count: matches.filter((m) => ["Engaged", "Married"].includes(m.status)).length },
          { key: "ended", label: "Ended", count: matches.filter((m) => ["Ended", "Boy Said No", "Girl Said No"].includes(m.status)).length },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${filterStatus === tab.key ? "bg-[#1B3A4B] text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Matches List */}
      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-gray-400">No matches in this category.</p>}
          {filtered.map((m) => {
            const step = statusSteps(m.status);
            const totalSteps = 7;
            const progress = step >= 0 ? ((step + 1) / totalSteps) * 100 : 0;
            const noteCount = m.match_notes?.length || 0;
            const dateCount = m.scheduled_dates?.length || 0;

            return (
              <Link key={m.id} href={`/matches/${m.id}`} className="block bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-base">
                      <span className="font-semibold text-[#1B3A4B]">{m.boy_profile?.name}</span>
                      <span className="text-gray-400 mx-2">&</span>
                      <span className="font-semibold text-[#C4956A]">{m.girl_profile?.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {m.boy_profile?.hashkafa} / {m.girl_profile?.hashkafa} · {m.boy_profile?.city} / {m.girl_profile?.city}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full text-white font-medium" style={{ background: STATUS_COLORS[m.status] || "#888" }}>
                      {m.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {step >= 0 && (
                  <div className="mb-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, background: STATUS_COLORS[m.status] || "#888" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      {["Idea", "Sent", "Reply", "Agreed", "Dating", "Engaged", "Married"].map((label, i) => (
                        <span key={label} className={`text-[9px] ${i <= step ? "text-[#1B3A4B] font-medium" : "text-gray-300"}`}>{label}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 text-xs text-gray-400">
                  <span>{noteCount} note{noteCount !== 1 ? "s" : ""}</span>
                  <span>{dateCount} date{dateCount !== 1 ? "s" : ""}</span>
                  <span>Started {new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
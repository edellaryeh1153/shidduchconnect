"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth, canDo } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { MATCH_STATUSES, STATUS_COLORS } from "@/types";

export default function MatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { appUser } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: m } = await supabase.from("matches")
      .select("*, boy_profile:profiles!boy_profile_id(*), girl_profile:profiles!girl_profile_id(*)")
      .eq("id", id).single();
    if (m) {
      setMatch(m);
      const { data: n } = await supabase.from("match_notes")
        .select("*, author:users!author_id(name)")
        .eq("match_id", id).order("created_at", { ascending: true });
      setNotes(n || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: string) {
    await supabase.from("matches").update({ status }).eq("id", id);
    await supabase.from("match_notes").insert({ match_id: id, author_id: appUser!.id, note_text: `Status changed to ${status}`, note_type: "status_change" });
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "updated_match_status", details: { status } });
    load();
  }

  async function addNote() {
    if (!newNote.trim() || !appUser) return;
    await supabase.from("match_notes").insert({ match_id: id, author_id: appUser.id, note_text: newNote.trim() });
    await supabase.from("audit_log").insert({ user_id: appUser.id, action: "added_match_note" });
    setNewNote("");
    load();
  }

  if (loading) return <AppShell><p className="text-gray-400">Loading...</p></AppShell>;
  if (!match) return <AppShell><p className="text-gray-500">Match not found.</p></AppShell>;

  const bp = match.boy_profile;
  const gp = match.girl_profile;

  return (
    <AppShell>
      <button onClick={() => router.push("/matches")} className="text-sm text-[#6B8E9B] hover:underline mb-4 block">← Back to Matches</button>
      <div className="bg-white rounded-xl p-6 border border-gray-200 max-w-4xl">
        {/* Header with status buttons */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            <span className="text-[#1B3A4B]">{bp?.name}</span>
            <span className="text-gray-400 mx-3">&</span>
            <span className="text-[#C4956A]">{gp?.name}</span>
          </h1>
          {canDo(appUser, "edit") && (
            <div className="flex gap-1.5 flex-wrap">
              {MATCH_STATUSES.map((s) => (
                <button key={s} onClick={() => updateStatus(s)}
                  className="px-3 py-1 rounded-full text-xs border transition-colors"
                  style={{
                    borderColor: STATUS_COLORS[s],
                    background: match.status === s ? STATUS_COLORS[s] : "transparent",
                    color: match.status === s ? "#fff" : "#777",
                  }}>{s}</button>
              ))}
            </div>
          )}
        </div>

        {/* Side-by-side profiles */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[bp, gp].filter(Boolean).map((p: any) => (
            <Link key={p.id} href={`/profiles/${p.id}`} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
              <div className="font-semibold text-sm mb-2" style={{ color: p.gender === "Girl" || p.gender === "girl" ? "#C4956A" : "#1B3A4B" }}>{p.name}</div>
              <div className="text-xs text-gray-600 space-y-0.5">
                {p.age && <div>Age: {p.age}</div>}
                {p.height && <div>Height: {p.height}</div>}
                {p.hashkafa && <div>Hashkafa: {p.hashkafa}</div>}
                {p.city && <div>Location: {p.city}{p.state && `, ${p.state}`}</div>}
                {p.occupation && <div>Occupation: {p.occupation}</div>}
              </div>
            </Link>
          ))}
        </div>

        {/* Notes */}
        <h3 className="text-base font-semibold text-[#1B3A4B] border-b pb-1 mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Notes & Date Reports
        </h3>
        {notes.length === 0 && <p className="text-gray-400 text-sm mb-3">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="p-3 bg-gray-50 rounded-lg mb-2" style={{ borderLeft: `3px solid ${n.note_type === "status_change" ? "#6B8E9B" : "#C4956A"}` }}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
              <span className="text-xs text-gray-400">{n.author?.name || ""}</span>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{n.note_text}</div>
          </div>
        ))}
        {canDo(appUser, "note") && (
          <div className="flex gap-2 mt-3">
            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note about a date, phone call, or observation..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] min-h-[50px]" />
            <button onClick={addNote} className="px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63] self-end">Add</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
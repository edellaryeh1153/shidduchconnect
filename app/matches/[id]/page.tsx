"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth, canDo } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { MATCH_STATUS_FLOW, STATUS_COLORS, DATE_FEEDBACK_OPTIONS } from "@/types";

export default function MatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { appUser } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [dates, setDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [showDateForm, setShowDateForm] = useState(false);
  const [dateForm, setDateForm] = useState({ dateTime: "", location: "", dateNumber: 1, notes: "" });
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [feedback, setFeedback] = useState({ boyFeedback: "", girlFeedback: "", boyWants: "", girlWants: "", endReason: "" });
  const [responseNote, setResponseNote] = useState("");

  async function load() {
    const { data: m } = await supabase.from("matches")
      .select("*, boy_profile:profiles!boy_profile_id(*), girl_profile:profiles!girl_profile_id(*)")
      .eq("id", id).single();
    if (m) {
      setMatch(m);
      const [nRes, dRes] = await Promise.all([
        supabase.from("match_notes").select("*, author:users!author_id(name)").eq("match_id", id).order("created_at", { ascending: true }),
        supabase.from("scheduled_dates").select("*").eq("match_id", id).order("date_time", { ascending: true }),
      ]);
      const allNotes = nRes.data || [];
      setNotes(allNotes.filter((n: any) => !n.is_private || n.author_id === appUser?.id));
      setDates(dRes.data || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function moveToStatus(newStatus: string) {
    await supabase.from("matches").update({ status: newStatus }).eq("id", id);
    let noteText = `Status: ${newStatus}`;
    if (responseNote.trim()) noteText += ` — ${responseNote.trim()}`;
    await supabase.from("match_notes").insert({ match_id: id, author_id: appUser!.id, note_text: noteText, note_type: "status_change" });

    if (responseNote.trim()) {
      if (newStatus.includes("Boy")) {
        await supabase.from("matches").update({ boy_response_notes: responseNote.trim() }).eq("id", id);
      } else if (newStatus.includes("Girl")) {
        await supabase.from("matches").update({ girl_response_notes: responseNote.trim() }).eq("id", id);
      }
    }

    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "updated_match_status", details: { status: newStatus } });
    setResponseNote("");
    load();
  }

  async function addNote() {
    if (!newNote.trim() || !appUser) return;
    await supabase.from("match_notes").insert({ match_id: id, author_id: appUser.id, note_text: newNote.trim(), is_private: notePrivate });
    setNewNote(""); setNotePrivate(false);
    load();
  }

  async function scheduleDate() {
    if (!dateForm.dateTime || !appUser) return;
    await supabase.from("scheduled_dates").insert({
      match_id: id, date_time: dateForm.dateTime, location: dateForm.location,
      date_number: dateForm.dateNumber, notes: dateForm.notes, created_by: appUser.id,
    });
    await supabase.from("match_notes").insert({
      match_id: id, author_id: appUser.id, note_type: "date_report",
      note_text: `Date #${dateForm.dateNumber} scheduled — ${new Date(dateForm.dateTime).toLocaleDateString()} at ${new Date(dateForm.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${dateForm.location ? ` at ${dateForm.location}` : ""}`,
    });
    setDateForm({ dateTime: "", location: "", dateNumber: dates.length + 2, notes: "" });
    setShowDateForm(false);
    load();
  }

  async function saveDateFeedback(dateId: string) {
    await supabase.from("scheduled_dates").update({
      status: "completed",
      boy_feedback: feedback.boyFeedback,
      girl_feedback: feedback.girlFeedback,
      boy_wants_another: feedback.boyWants,
      girl_wants_another: feedback.girlWants,
      end_reason: feedback.endReason,
    }).eq("id", dateId);

    let noteText = `Date #${dates.find((d) => d.id === dateId)?.date_number || "?"} completed\n`;
    noteText += `Boy: ${feedback.boyWants || "?"} — ${feedback.boyFeedback || "No feedback"}\n`;
    noteText += `Girl: ${feedback.girlWants || "?"} — ${feedback.girlFeedback || "No feedback"}`;
    if (feedback.endReason) noteText += `\nReason if no: ${feedback.endReason}`;

    await supabase.from("match_notes").insert({ match_id: id, author_id: appUser!.id, note_text: noteText, note_type: "date_report" });
    setShowFeedback(null);
    setFeedback({ boyFeedback: "", girlFeedback: "", boyWants: "", girlWants: "", endReason: "" });
    load();
  }

  async function cancelDate(dateId: string) {
    await supabase.from("scheduled_dates").update({ status: "cancelled" }).eq("id", dateId);
    load();
  }

  if (loading) return <AppShell><p className="text-gray-400">Loading...</p></AppShell>;
  if (!match) return <AppShell><p className="text-gray-500">Match not found.</p></AppShell>;

  const bp = match.boy_profile;
  const gp = match.girl_profile;
  const nextStatuses = MATCH_STATUS_FLOW[match.status] || [];
  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/30 bg-white";

  // Progress
  const allSteps = ["Idea", "Sent", "Response", "Both Agreed", "Dating", "Engaged", "Married"];
  const stepMap: Record<string, number> = {
    "Suggested": 0, "Sent to Boy Side": 1, "Sent to Girl Side": 1,
    "Boy Said Yes": 2, "Girl Said Yes": 2, "Boy Said No": 2, "Girl Said No": 2,
    "Both Agreed": 3, "Dating": 4, "Engaged": 5, "Married": 6, "Ended": -1,
  };
  const currentStep = stepMap[match.status] ?? 0;

  return (
    <AppShell>
      <button onClick={() => router.push("/matches")} className="text-sm text-[#6B8E9B] hover:underline mb-4 block">← Back to Matches</button>
      <div className="bg-white rounded-xl border border-gray-200 max-w-4xl">

        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                <span className="text-[#1B3A4B]">{bp?.name}</span>
                <span className="text-gray-400 mx-3">&</span>
                <span className="text-[#C4956A]">{gp?.name}</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-3 py-1 rounded-full text-white font-medium" style={{ background: STATUS_COLORS[match.status] || "#888" }}>{match.status}</span>
                <span className="text-xs text-gray-400">Started {new Date(match.created_at).toLocaleDateString()}</span>
                <span className="text-xs text-gray-400">· Contacted {match.contacted_first} side first</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {currentStep >= 0 && (
            <div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${((currentStep + 1) / allSteps.length) * 100}%`, background: STATUS_COLORS[match.status] || "#888" }} />
              </div>
              <div className="flex justify-between">
                {allSteps.map((label, i) => (
                  <span key={label} className={`text-[10px] ${i <= currentStep ? "text-[#1B3A4B] font-semibold" : "text-gray-300"}`}>{label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons — next steps */}
        {canDo(appUser, "edit") && nextStatuses.length > 0 && (
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#1B3A4B] mb-2">Next Steps</h3>
            <div className="mb-3">
              <textarea value={responseNote} onChange={(e) => setResponseNote(e.target.value)}
                placeholder={match.status.includes("Sent") ? "Notes from the conversation (what did they say?)..." : match.status.includes("Said No") ? "Why did they say no? This helps for future matches..." : "Any notes about this step..."}
                className={inp + " min-h-[50px]"} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {nextStatuses.map((s) => {
                const isNegative = s.includes("No") || s === "Ended";
                const isPositive = s.includes("Yes") || s === "Both Agreed" || s === "Dating" || s === "Engaged" || s === "Married";
                return (
                  <button key={s} onClick={() => moveToStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isPositive ? "bg-green-600 text-white hover:bg-green-700" :
                      isNegative ? "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200" :
                      "bg-[#1B3A4B] text-white hover:bg-[#244E63]"
                    }`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Response notes if any */}
          {(match.boy_response_notes || match.girl_response_notes) && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              {match.boy_response_notes && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium mb-1">Boy Side Response</div>
                  <p className="text-sm text-blue-900">{match.boy_response_notes}</p>
                </div>
              )}
              {match.girl_response_notes && (
                <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                  <div className="text-xs text-pink-600 font-medium mb-1">Girl Side Response</div>
                  <p className="text-sm text-pink-900">{match.girl_response_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Side-by-side profiles */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[bp, gp].filter(Boolean).map((p: any) => (
              <Link key={p.id} href={`/profiles/${p.id}`} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="font-semibold text-sm mb-2" style={{ color: p.gender === "Girl" ? "#C4956A" : "#1B3A4B" }}>{p.name}</div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  {p.age && <div>Age: {p.age}</div>}
                  {p.height && <div>Height: {p.height}</div>}
                  {p.hashkafa && <div>Hashkafa: {p.hashkafa}</div>}
                  {p.learning_status && <div>{p.learning_status}</div>}
                  {p.city && <div>{p.city}{p.state && `, ${p.state}`}</div>}
                  {p.occupation && <div>{p.occupation}</div>}
                  {p.personality_traits?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.personality_traits.slice(0, 4).map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-200 text-gray-600">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Date Schedule */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Dates ({dates.length})
              </h3>
              {canDo(appUser, "edit") && ["Dating", "Both Agreed"].includes(match.status) && (
                <button onClick={() => { setShowDateForm(!showDateForm); setDateForm((prev) => ({ ...prev, dateNumber: dates.length + 1 })); }}
                  className="text-sm text-[#C4956A] hover:underline">
                  {showDateForm ? "Cancel" : "+ Schedule Date"}
                </button>
              )}
            </div>

            {showDateForm && (
              <div className="p-4 bg-[#C4956A]/5 border border-[#C4956A]/20 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Date & Time *</label><input type="datetime-local" className={inp} value={dateForm.dateTime} onChange={(e) => setDateForm({ ...dateForm, dateTime: e.target.value })} /></div>
                  <div><label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Location</label><input className={inp} value={dateForm.location} onChange={(e) => setDateForm({ ...dateForm, location: e.target.value })} placeholder="Restaurant, hotel lobby..." /></div>
                  <div><label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Date #</label><input type="number" className={inp} min="1" value={dateForm.dateNumber} onChange={(e) => setDateForm({ ...dateForm, dateNumber: parseInt(e.target.value) || 1 })} /></div>
                  <div><label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</label><input className={inp} value={dateForm.notes} onChange={(e) => setDateForm({ ...dateForm, notes: e.target.value })} /></div>
                </div>
                <button onClick={scheduleDate} disabled={!dateForm.dateTime} className="px-4 py-2 bg-[#C4956A] text-white rounded-lg text-sm disabled:opacity-50">Schedule</button>
              </div>
            )}

            {dates.length === 0 && <p className="text-gray-400 text-sm">No dates scheduled.</p>}
            {dates.map((d) => {
              const isPast = new Date(d.date_time) < new Date();
              const needsFeedback = d.status === "scheduled" && isPast;
              const colors: Record<string, string> = { scheduled: "#6B8E9B", completed: "#5C8A5C", cancelled: "#A0736C" };
              return (
                <div key={d.id} className="border border-gray-100 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: colors[d.status] || "#888" }}>#{d.date_number}</div>
                      <div>
                        <div className="text-sm font-medium text-[#1B3A4B]">
                          {new Date(d.date_time).toLocaleDateString()} · {new Date(d.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-xs text-gray-500">{d.location && `${d.location} · `}<span className="capitalize">{d.status}</span></div>
                      </div>
                    </div>
                    {canDo(appUser, "edit") && d.status === "scheduled" && (
                      <div className="flex gap-2">
                        {needsFeedback ? (
                          <button onClick={() => { setShowFeedback(d.id); setFeedback({ boyFeedback: "", girlFeedback: "", boyWants: "", girlWants: "", endReason: "" }); }}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">Enter Feedback</button>
                        ) : (
                          <>
                            <button onClick={() => { setShowFeedback(d.id); setFeedback({ boyFeedback: "", girlFeedback: "", boyWants: "", girlWants: "", endReason: "" }); }}
                              className="text-xs text-green-600 hover:underline">Complete</button>
                            <button onClick={() => cancelDate(d.id)} className="text-xs text-red-500 hover:underline">Cancel</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Feedback display for completed dates */}
                  {d.status === "completed" && (d.boy_feedback || d.girl_feedback) && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-[10px] text-blue-600 font-medium uppercase">Boy Feedback</div>
                        <div className="text-xs text-blue-900 mt-0.5">{d.boy_feedback || "No feedback"}</div>
                        <div className="text-[10px] text-blue-600 mt-1">Another date? <strong>{d.boy_wants_another || "?"}</strong></div>
                      </div>
                      <div className="p-2 bg-pink-50 rounded">
                        <div className="text-[10px] text-pink-600 font-medium uppercase">Girl Feedback</div>
                        <div className="text-xs text-pink-900 mt-0.5">{d.girl_feedback || "No feedback"}</div>
                        <div className="text-[10px] text-pink-600 mt-1">Another date? <strong>{d.girl_wants_another || "?"}</strong></div>
                      </div>
                      {d.end_reason && (
                        <div className="col-span-2 p-2 bg-red-50 rounded">
                          <div className="text-[10px] text-red-600 font-medium uppercase">Reason for not continuing</div>
                          <div className="text-xs text-red-900 mt-0.5">{d.end_reason}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback form */}
                  {showFeedback === d.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-blue-600 font-medium uppercase mb-1">Boy — wants another date?</label>
                          <div className="flex gap-2 mb-2">
                            {DATE_FEEDBACK_OPTIONS.map((opt) => (
                              <button key={opt} type="button" onClick={() => setFeedback({ ...feedback, boyWants: opt })}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${feedback.boyWants === opt
                                  ? opt === "Yes" ? "bg-green-600 text-white border-green-600" : opt === "No" ? "bg-red-500 text-white border-red-500" : "bg-amber-500 text-white border-amber-500"
                                  : "bg-white text-gray-600 border-gray-300"}`}>{opt}</button>
                            ))}
                          </div>
                          <textarea className={inp + " min-h-[50px]"} value={feedback.boyFeedback} onChange={(e) => setFeedback({ ...feedback, boyFeedback: e.target.value })} placeholder="How did the boy feel? What did he say?" />
                        </div>
                        <div>
                          <label className="block text-xs text-pink-600 font-medium uppercase mb-1">Girl — wants another date?</label>
                          <div className="flex gap-2 mb-2">
                            {DATE_FEEDBACK_OPTIONS.map((opt) => (
                              <button key={opt} type="button" onClick={() => setFeedback({ ...feedback, girlWants: opt })}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${feedback.girlWants === opt
                                  ? opt === "Yes" ? "bg-green-600 text-white border-green-600" : opt === "No" ? "bg-red-500 text-white border-red-500" : "bg-amber-500 text-white border-amber-500"
                                  : "bg-white text-gray-600 border-gray-300"}`}>{opt}</button>
                            ))}
                          </div>
                          <textarea className={inp + " min-h-[50px]"} value={feedback.girlFeedback} onChange={(e) => setFeedback({ ...feedback, girlFeedback: e.target.value })} placeholder="How did the girl feel? What did she say?" />
                        </div>
                      </div>
                      {(feedback.boyWants === "No" || feedback.girlWants === "No") && (
                        <div>
                          <label className="block text-xs text-red-600 font-medium uppercase mb-1">Why not? (important for future matches)</label>
                          <textarea className={inp + " min-h-[50px]"} value={feedback.endReason} onChange={(e) => setFeedback({ ...feedback, endReason: e.target.value })} placeholder="What specifically didn't work? Personality, hashkafa mismatch, chemistry, goals..." />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => saveDateFeedback(d.id)} className="px-4 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm">Save Feedback</button>
                        <button onClick={() => setShowFeedback(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-base font-semibold text-[#1B3A4B] border-b pb-1 mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              All Notes ({notes.length})
            </h3>
            {notes.length === 0 && <p className="text-gray-400 text-sm mb-3">No notes yet.</p>}
            {notes.map((n) => (
              <div key={n.id} className={`p-3 rounded-lg mb-2 ${n.is_private ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}
                style={{ borderLeft: `3px solid ${n.note_type === "status_change" ? "#6B8E9B" : n.note_type === "date_report" ? "#C4956A" : n.is_private ? "#D4A853" : "#C4956A"}` }}>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                    {n.is_private && <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded">🔒 Private</span>}
                    {n.note_type === "date_report" && <span className="text-[10px] px-1.5 py-0.5 bg-[#C4956A]/20 text-[#8B7355] rounded">Date Report</span>}
                    {n.note_type === "status_change" && <span className="text-[10px] px-1.5 py-0.5 bg-[#6B8E9B]/20 text-[#6B8E9B] rounded">Status</span>}
                  </div>
                  <span className="text-xs text-gray-400">{n.author?.name || ""}</span>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{n.note_text}</div>
              </div>
            ))}
            {canDo(appUser, "note") && (
              <div className="mt-3">
                <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] min-h-[60px]" />
                <div className="flex justify-between items-center mt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={notePrivate} onChange={(e) => setNotePrivate(e.target.checked)} className="rounded" />
                    🔒 Private note (only you)
                  </label>
                  <button onClick={addNote} className="px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63]">Add Note</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
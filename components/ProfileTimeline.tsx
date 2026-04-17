"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { STATUS_COLORS } from "@/types";

type Props = {
  profileId: string;
};

type TimelineEvent = {
  id: string;
  title: string;
  detail: string;
  link?: string;
  color: string;
  timestamp: string;
};

export default function ProfileTimeline({ profileId }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      const allEvents: TimelineEvent[] = [];

      const { data: profile } = await supabase.from("profiles").select("created_at, name").eq("id", profileId).single();
      if (profile) {
        allEvents.push({
          id: "created", title: "Profile created",
          detail: `${profile.name} was added to the system.`,
          color: "#5C8A5C", timestamp: profile.created_at,
        });
      }

      const { data: shares } = await supabase.from("profile_shares")
        .select("id, created_at, shared_with").eq("profile_id", profileId);
      
      if (shares && shares.length > 0) {
        const userIds = shares.map((s: any) => s.shared_with);
        const { data: shareUsers } = await supabase.from("users").select("id, name").in("id", userIds);
        const userMap: Record<string, string> = {};
        (shareUsers || []).forEach((u: any) => { userMap[u.id] = u.name; });
        
        shares.forEach((s: any) => {
          allEvents.push({
            id: `share-${s.id}`, title: "Profile shared",
            detail: `Shared with ${userMap[s.shared_with] || "a shadchan"}.`,
            color: "#6B8E9B", timestamp: s.created_at,
          });
        });
      }

      const { data: matches } = await supabase.from("matches")
        .select("id, status, created_at, boy_profile_id, girl_profile_id")
        .or(`boy_profile_id.eq.${profileId},girl_profile_id.eq.${profileId}`);

      if (matches && matches.length > 0) {
        const otherIds = matches.map((m: any) => m.boy_profile_id === profileId ? m.girl_profile_id : m.boy_profile_id);
        const { data: otherProfiles } = await supabase.from("profiles").select("id, name").in("id", otherIds);
        const nameMap: Record<string, string> = {};
        (otherProfiles || []).forEach((p: any) => { nameMap[p.id] = p.name; });

        const matchIds = matches.map((m: any) => m.id);

        matches.forEach((m: any) => {
          const otherId = m.boy_profile_id === profileId ? m.girl_profile_id : m.boy_profile_id;
          allEvents.push({
            id: `match-${m.id}`, title: "Match suggested",
            detail: `Matched with ${nameMap[otherId] || "someone"}. Status: ${m.status}.`,
            link: `/matches/${m.id}`,
            color: STATUS_COLORS[m.status] || "#888", timestamp: m.created_at,
          });
        });

        const { data: notes } = await supabase.from("match_notes")
          .select("id, note_text, note_type, created_at, match_id, author_id")
          .in("match_id", matchIds).order("created_at", { ascending: false });

        if (notes) {
          const authorIds = [...new Set(notes.map((n: any) => n.author_id))];
          const { data: authors } = await supabase.from("users").select("id, name").in("id", authorIds);
          const authorMap: Record<string, string> = {};
          (authors || []).forEach((a: any) => { authorMap[a.id] = a.name; });

          notes.forEach((n: any) => {
            const match = matches.find((m: any) => m.id === n.match_id);
            const otherId = match?.boy_profile_id === profileId ? match?.girl_profile_id : match?.boy_profile_id;
            allEvents.push({
              id: `note-${n.id}`,
              title: n.note_type === "status_change" ? "Status updated" : n.note_type === "date_report" ? "Date report" : "Note added",
              detail: `${n.note_text.substring(0, 120)}${n.note_text.length > 120 ? "..." : ""} (with ${nameMap[otherId] || "?"})`,
              link: `/matches/${n.match_id}`,
              color: n.note_type === "status_change" ? "#6B8E9B" : "#C4956A",
              timestamp: n.created_at,
            });
          });
        }

        const { data: dates } = await supabase.from("scheduled_dates")
          .select("id, date_time, date_number, status, location, match_id")
          .in("match_id", matchIds);

        if (dates) {
          dates.forEach((d: any) => {
            const match = matches.find((m: any) => m.id === d.match_id);
            const otherId = match?.boy_profile_id === profileId ? match?.girl_profile_id : match?.boy_profile_id;
            allEvents.push({
              id: `date-${d.id}`,
              title: `Date #${d.date_number} ${d.status}`,
              detail: `With ${nameMap[otherId] || "?"}${d.location ? ` at ${d.location}` : ""}.`,
              link: `/matches/${d.match_id}`,
              color: d.status === "completed" ? "#5C8A5C" : d.status === "cancelled" ? "#A0736C" : "#6B8E9B",
              timestamp: d.date_time,
            });
          });
        }
      }

      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEvents(allEvents);
      setLoading(false);
    }
    load();
  }, [profileId]);

  const displayed = expanded ? events : events.slice(0, 5);

  if (loading) return <p className="text-gray-400 text-sm">Loading timeline...</p>;
  if (events.length === 0) return <p className="text-gray-400 text-sm">No activity yet.</p>;

  return (
    <div>
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-200" />
        {displayed.map((event) => (
          <div key={event.id} className="relative mb-4 last:mb-0">
            <div className="absolute left-[-19px] top-1.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: event.color }} />
            <div className={`${event.link ? "cursor-pointer hover:bg-gray-50" : ""} rounded-lg p-2 -ml-1 transition-colors`}>
              {event.link ? (
                <Link href={event.link} className="block">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-[#1B3A4B]">{event.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">{new Date(event.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{event.detail}</p>
                </Link>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-[#1B3A4B]">{event.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">{new Date(event.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{event.detail}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {events.length > 5 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#C4956A] hover:underline mt-2 ml-6">
          {expanded ? "Show less" : `Show all ${events.length} events`}
        </button>
      )}
    </div>
  );
}
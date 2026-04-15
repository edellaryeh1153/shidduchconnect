"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { STATUS_COLORS } from "@/types";

export default function DashboardPage() {
  const { appUser } = useAuth();
  const [myProfiles, setMyProfiles] = useState<any[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [dates, setDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!appUser) return;
    async function load() {
      // Get profiles I created
      const { data: mine } = await supabase.from("profiles").select("*")
        .eq("created_by", appUser!.id).order("created_at", { ascending: false });

      // Get profiles shared with me
      const { data: shares } = await supabase.from("profile_shares").select("profile_id").eq("shared_with", appUser!.id);
      const sharedIds = (shares || []).map((s: any) => s.profile_id);
      let shared: any[] = [];
      if (sharedIds.length > 0) {
        const { data: sp } = await supabase.from("profiles").select("*").in("id", sharedIds);
        shared = sp || [];
      }

      // If admin, get all profiles
      let allVisible = [...(mine || [])];
      if (appUser!.role === "admin") {
        const { data: all } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        allVisible = all || [];
        shared = [];
      } else {
        // Add shared ones that aren't already in mine
        const myIds = new Set((mine || []).map((p: any) => p.id));
        shared = shared.filter((p: any) => !myIds.has(p.id));
      }

      // Get my matches (ones I created or involving my profiles)
      const myProfileIds = allVisible.map((p: any) => p.id);
      const { data: matchData } = await supabase.from("matches")
        .select("*, boy_profile:profiles!boy_profile_id(name, gender), girl_profile:profiles!girl_profile_id(name, gender)")
        .order("created_at", { ascending: false });

      const myMatches = (matchData || []).filter((m: any) =>
        m.created_by === appUser!.id ||
        myProfileIds.includes(m.boy_profile_id) ||
        myProfileIds.includes(m.girl_profile_id)
      );

      // Get upcoming dates for my matches
      const myMatchIds = myMatches.map((m: any) => m.id);
      let dateData: any[] = [];
      if (myMatchIds.length > 0) {
        const { data: d } = await supabase.from("scheduled_dates")
          .select("*, match:matches(*, boy_profile:profiles!boy_profile_id(name), girl_profile:profiles!girl_profile_id(name))")
          .in("match_id", myMatchIds)
          .eq("status", "scheduled")
          .gte("date_time", new Date().toISOString())
          .order("date_time", { ascending: true });
        dateData = d || [];
      }

      setMyProfiles(allVisible);
      setSharedWithMe(shared);
      setMatches(myMatches);
      setDates(dateData);
      setLoading(false);
    }
    load();
  }, [appUser]);

  const boys = myProfiles.filter((p) => p.gender === "Boy");
  const girls = myProfiles.filter((p) => p.gender === "Girl");
  const activeMatches = matches.filter((m) => !["Ended", "Married", "Boy Said No", "Girl Said No"].includes(m.status));
  const married = matches.filter((m) => m.status === "Married");
  const dating = matches.filter((m) => m.status === "Dating");

  // Hashkafa chart
  const hashkafaCounts: Record<string, number> = {};
  myProfiles.forEach((p) => { const h = p.hashkafa || "Unknown"; hashkafaCounts[h] = (hashkafaCounts[h] || 0) + 1; });
  const maxH = Math.max(...Object.values(hashkafaCounts), 1);

  // Age chart
  const ageBuckets: Record<string, number> = { "18-20": 0, "21-23": 0, "24-26": 0, "27-30": 0, "31+": 0 };
  myProfiles.forEach((p) => {
    const age = p.age || 0;
    if (age >= 18 && age <= 20) ageBuckets["18-20"]++;
    else if (age >= 21 && age <= 23) ageBuckets["21-23"]++;
    else if (age >= 24 && age <= 26) ageBuckets["24-26"]++;
    else if (age >= 27 && age <= 30) ageBuckets["27-30"]++;
    else if (age >= 31) ageBuckets["31+"]++;
  });
  const maxA = Math.max(...Object.values(ageBuckets), 1);

  // Match status chart
  const statusCounts: Record<string, number> = {};
  matches.forEach((m) => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });

  // Smart search across MY profiles only
  const allSearchable = [...myProfiles, ...sharedWithMe];
  const searchResults = search.trim() ? allSearchable.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s) ||
      p.state?.toLowerCase().includes(s) || p.hashkafa?.toLowerCase().includes(s) ||
      p.occupation?.toLowerCase().includes(s) || p.shul?.toLowerCase().includes(s) ||
      p.rav?.toLowerCase().includes(s) || p.camp?.toLowerCase().includes(s) ||
      p.about?.toLowerCase().includes(s) || p.learning_status?.toLowerCase().includes(s) ||
      p.looking_for_description?.toLowerCase().includes(s) ||
      p.mother_name?.toLowerCase().includes(s) || p.father_name?.toLowerCase().includes(s) ||
      (p.schools && JSON.stringify(p.schools).toLowerCase().includes(s)) ||
      (p.personality_traits && p.personality_traits.some((t: string) => t.toLowerCase().includes(s)))
    );
  }) : [];

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        Welcome back{appUser?.name ? `, ${appUser.name}` : ""}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {appUser?.role === "admin" ? "Viewing all profiles (Admin)" : `Viewing your profiles + ${sharedWithMe.length} shared with you`}
      </p>

      {/* Smart Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your profiles — names, cities, schools, shuls, traits, occupation..."
            className="w-full px-3 py-2 text-sm focus:outline-none" />
          {search && <button onClick={() => setSearch("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3 max-h-[300px] overflow-y-auto">
            <p className="text-xs text-gray-400 mb-2">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
            {searchResults.map((p) => (
              <Link key={p.id} href={`/profiles/${p.id}`} className="flex items-center gap-3 py-2 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${p.gender === "Girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-[#1B3A4B] truncate">{p.name}</div>
                  <div className="text-xs text-gray-500 truncate">{p.gender} · {p.age || "?"} · {p.hashkafa} · {p.city}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {search && searchResults.length === 0 && <p className="text-sm text-gray-400 mt-2">No results found in your profiles.</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "My Girls", value: girls.length, color: "#C4956A" },
          { label: "My Boys", value: boys.length, color: "#1B3A4B" },
          { label: "Active Matches", value: activeMatches.length, color: "#6B8E9B" },
          { label: "Dating", value: dating.length, color: "#C4956A" },
          { label: "Married", value: married.length, color: "#5C8A5C" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {loading ? "..." : s.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-[#1B3A4B] mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>By Hashkafa</h3>
          <div className="space-y-2">
            {Object.entries(hashkafaCounts).sort((a, b) => b[1] - a[1]).map(([h, count]) => (
              <div key={h}>
                <div className="flex justify-between text-xs mb-0.5"><span className="text-gray-600 truncate">{h}</span><span className="text-gray-400 shrink-0 ml-2">{count}</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-[#1B3A4B] h-2 rounded-full" style={{ width: `${(count / maxH) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-[#1B3A4B] mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Age Distribution</h3>
          <div className="flex items-end gap-2 h-[120px]">
            {Object.entries(ageBuckets).map(([label, count]) => (
              <div key={label} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full bg-[#C4956A] rounded-t" style={{ height: `${(count / maxA) * 100}%`, minHeight: count > 0 ? 8 : 0 }} />
                <div className="text-[10px] text-gray-500 mt-1">{label}</div>
                <div className="text-[10px] text-gray-400">{count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h3 className="text-sm font-semibold text-[#1B3A4B] mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Match Status</h3>
          {Object.keys(statusCounts).length === 0 ? <p className="text-xs text-gray-400">No matches yet.</p> : (
            <div className="space-y-2">
              {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[status] || "#888" }} />
                  <span className="text-xs text-gray-600 flex-1">{status}</span>
                  <span className="text-xs font-medium text-gray-800">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shared with me section */}
      {sharedWithMe.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            👥 Shared With You ({sharedWithMe.length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {sharedWithMe.map((p) => (
              <Link key={p.id} href={`/profiles/${p.id}`} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-all">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${p.gender === "Girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-[#1B3A4B] truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.gender} · {p.age || "?"}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Dates & Recent */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Upcoming Dates</h2>
          {dates.length === 0 && <p className="text-gray-400 text-sm">No upcoming dates.</p>}
          {dates.slice(0, 5).map((d) => (
            <Link key={d.id} href={`/matches/${d.match_id}`} className="block py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-[#1B3A4B]">{d.match?.boy_profile?.name} & {d.match?.girl_profile?.name}</div>
                  <div className="text-xs text-gray-500">Date #{d.date_number}{d.location && ` · ${d.location}`}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-[#C4956A]">{new Date(d.date_time).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-400">{new Date(d.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Recent Matches</h2>
            <Link href="/matches" className="text-sm text-[#6B8E9B] hover:underline">View all →</Link>
          </div>
          {matches.length === 0 && <p className="text-gray-400 text-sm">No matches yet.</p>}
          {matches.slice(0, 5).map((m) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[m.status] || "#888" }} />
              <div className="min-w-0">
                <div className="text-sm truncate"><span className="font-medium text-[#1B3A4B]">{m.boy_profile?.name}</span> <span className="text-gray-400">&</span> <span className="font-medium text-[#C4956A]">{m.girl_profile?.name}</span></div>
                <div className="text-xs text-gray-500">{m.status}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* My Recent Profiles */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>My Recent Profiles</h2>
          <Link href="/profiles" className="text-sm text-[#6B8E9B] hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {myProfiles.slice(0, 6).map((p) => (
            <Link key={p.id} href={`/profiles/${p.id}`} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:shadow-sm transition-all">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${p.gender === "Girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                {p.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm text-[#1B3A4B] truncate">{p.name}</div>
                <div className="text-xs text-gray-500">{p.gender} · {p.age || "?"} · {p.hashkafa} · {p.city}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
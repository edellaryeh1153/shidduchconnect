"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { STATUS_COLORS, HASHKAFOS } from "@/types";

export default function DashboardPage() {
  const { appUser } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [dates, setDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [pRes, mRes, dRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("matches").select("*, boy_profile:profiles!boy_profile_id(name), girl_profile:profiles!girl_profile_id(name)").order("created_at", { ascending: false }),
        supabase.from("scheduled_dates").select("*, match:matches(*, boy_profile:profiles!boy_profile_id(name), girl_profile:profiles!girl_profile_id(name))").eq("status", "scheduled").order("date_time", { ascending: true }).limit(5),
      ]);
      setProfiles(pRes.data || []);
      setMatches(mRes.data || []);
      setDates(dRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const boys = profiles.filter((p) => p.gender === "Boy" || p.gender === "boy");
  const girls = profiles.filter((p) => p.gender === "Girl" || p.gender === "girl");
  const activeMatches = matches.filter((m) => !["Ended", "Married"].includes(m.status));
  const married = matches.filter((m) => m.status === "Married");
  const dating = matches.filter((m) => m.status === "Dating");

  // Hashkafa breakdown
  const hashkafaCounts: Record<string, { boys: number; girls: number }> = {};
  HASHKAFOS.forEach((h) => { hashkafaCounts[h] = { boys: 0, girls: 0 }; });
  profiles.forEach((p) => {
    if (p.hashkafa && hashkafaCounts[p.hashkafa]) {
      if (p.gender === "Boy" || p.gender === "boy") hashkafaCounts[p.hashkafa].boys++;
      else hashkafaCounts[p.hashkafa].girls++;
    }
  });
  const hashkafaData = HASHKAFOS.map((h) => ({ name: h, ...hashkafaCounts[h], total: hashkafaCounts[h].boys + hashkafaCounts[h].girls })).filter((d) => d.total > 0);

  // Match status breakdown
  const statusCounts: Record<string, number> = {};
  matches.forEach((m) => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });

  // Age distribution
  const ageBuckets: Record<string, { boys: number; girls: number }> = { "18-20": { boys: 0, girls: 0 }, "21-23": { boys: 0, girls: 0 }, "24-26": { boys: 0, girls: 0 }, "27-30": { boys: 0, girls: 0 }, "31+": { boys: 0, girls: 0 } };
  profiles.forEach((p) => {
    if (!p.age) return;
    const bucket = p.age <= 20 ? "18-20" : p.age <= 23 ? "21-23" : p.age <= 26 ? "24-26" : p.age <= 30 ? "27-30" : "31+";
    if (p.gender === "Boy" || p.gender === "boy") ageBuckets[bucket].boys++;
    else ageBuckets[bucket].girls++;
  });

  const maxBar = Math.max(...Object.values(ageBuckets).map((b) => Math.max(b.boys, b.girls)), 1);

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        Welcome back{appUser?.name ? `, ${appUser.name}` : ""}
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "Girls", value: girls.length, color: "#C4956A" },
          { label: "Boys", value: boys.length, color: "#1B3A4B" },
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

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Age Distribution Chart */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Age Distribution</h2>
          <div className="space-y-3">
            {Object.entries(ageBuckets).map(([bucket, counts]) => (
              <div key={bucket} className="flex items-center gap-3">
                <div className="w-12 text-xs text-gray-500 text-right shrink-0">{bucket}</div>
                <div className="flex-1 flex gap-1">
                  <div className="h-5 rounded-l bg-[#1B3A4B] transition-all" style={{ width: `${(counts.boys / maxBar) * 100}%`, minWidth: counts.boys > 0 ? 8 : 0 }}>
                    {counts.boys > 0 && <span className="text-[10px] text-white px-1">{counts.boys}</span>}
                  </div>
                  <div className="h-5 rounded-r bg-[#C4956A] transition-all" style={{ width: `${(counts.girls / maxBar) * 100}%`, minWidth: counts.girls > 0 ? 8 : 0 }}>
                    {counts.girls > 0 && <span className="text-[10px] text-white px-1">{counts.girls}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1B3A4B] inline-block"></span> Boys</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#C4956A] inline-block"></span> Girls</span>
          </div>
        </div>

        {/* Match Status Chart */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Match Status Breakdown</h2>
          {matches.length === 0 ? <p className="text-gray-400 text-sm">No matches yet.</p> : (
            <div className="space-y-2">
              {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-gray-600 text-right shrink-0">{status}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="h-full rounded-full flex items-center px-2 transition-all" style={{ width: `${(count / matches.length) * 100}%`, background: STATUS_COLORS[status] || "#888", minWidth: 24 }}>
                      <span className="text-[10px] text-white font-medium">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Hashkafa Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Profiles by Hashkafa</h2>
          {hashkafaData.length === 0 ? <p className="text-gray-400 text-sm">No data yet.</p> : (
            <div className="space-y-2">
              {hashkafaData.sort((a, b) => b.total - a.total).map((d) => (
                <div key={d.name} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#1B3A4B] font-medium">{d.boys}B</span>
                    <span className="text-xs text-gray-400">/</span>
                    <span className="text-xs text-[#C4956A] font-medium">{d.girls}G</span>
                    <span className="text-xs text-gray-400 ml-1">({d.total})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Dates */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Upcoming Dates</h2>
          {dates.length === 0 ? <p className="text-gray-400 text-sm">No scheduled dates.</p> : (
            <div className="space-y-2">
              {dates.map((d) => (
                <Link key={d.id} href={`/matches/${d.match_id}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-[#1B3A4B]">
                        {d.match?.boy_profile?.name} & {d.match?.girl_profile?.name}
                      </div>
                      <div className="text-xs text-gray-500">Date #{d.date_number}{d.location && ` · ${d.location}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#C4956A]">{new Date(d.date_time).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{new Date(d.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity row */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Recent Profiles</h2>
            <Link href="/profiles" className="text-sm text-[#6B8E9B] hover:underline">View all →</Link>
          </div>
          {profiles.slice(0, 5).map((p: any) => (
            <Link key={p.id} href={`/profiles/${p.id}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${p.gender === "Girl" || p.gender === "girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                {p.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div className="font-medium text-sm text-[#1B3A4B]">{p.name}</div>
                <div className="text-xs text-gray-500">{p.gender} · {p.age || "?"} · {p.city || ""}{p.hashkafa ? ` · ${p.hashkafa}` : ""}</div>
              </div>
            </Link>
          ))}
          {profiles.length === 0 && <p className="text-gray-400 text-sm">No profiles yet.</p>}
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Recent Matches</h2>
            <Link href="/matches" className="text-sm text-[#6B8E9B] hover:underline">View all →</Link>
          </div>
          {matches.slice(0, 5).map((m: any) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[m.status] || "#888" }} />
              <div>
                <div className="text-sm"><span className="font-medium text-[#1B3A4B]">{m.boy_profile?.name}</span> <span className="text-gray-400">&</span> <span className="font-medium text-[#C4956A]">{m.girl_profile?.name}</span></div>
                <div className="text-xs text-gray-500">{m.status}</div>
              </div>
            </Link>
          ))}
          {matches.length === 0 && <p className="text-gray-400 text-sm">No matches yet.</p>}
        </div>
      </div>
    </AppShell>
  );
}
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { STATUS_COLORS } from "@/types";

export default function DashboardPage() {
  const { appUser } = useAuth();
  const [stats, setStats] = useState({ boys: 0, girls: 0, activeMatches: 0, married: 0 });
  const [recentProfiles, setRecentProfiles] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [boys, girls, matches, profiles] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("gender", "Boy"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("gender", "Girl"),
        supabase.from("matches").select("*, boy_profile:profiles!boy_profile_id(name), girl_profile:profiles!girl_profile_id(name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("id, name, gender, age, city, hashkafa, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const allMatches = matches.data || [];
      setStats({
        boys: boys.count || 0, girls: girls.count || 0,
        activeMatches: allMatches.filter((m: any) => !["Ended", "Married"].includes(m.status)).length,
        married: allMatches.filter((m: any) => m.status === "Married").length,
      });
      setRecentProfiles(profiles.data || []);
      setRecentMatches(allMatches);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        Welcome back{appUser?.name ? `, ${appUser.name}` : ""}
      </h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Girls", value: stats.girls, color: "#C4956A" },
          { label: "Boys", value: stats.boys, color: "#1B3A4B" },
          { label: "Active Matches", value: stats.activeMatches, color: "#6B8E9B" },
          { label: "Married", value: stats.married, color: "#5C8A5C" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 text-center">
            <div className="text-3xl font-bold" style={{ color: s.color, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {loading ? "..." : s.value}
            </div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Recent Profiles</h2>
            <Link href="/profiles" className="text-sm text-[#6B8E9B] hover:underline">View all →</Link>
          </div>
          {recentProfiles.length === 0 && <p className="text-gray-400 text-sm">No profiles yet.</p>}
          {recentProfiles.map((p: any) => (
            <Link key={p.id} href={`/profiles/${p.id}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${p.gender === "Girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                {p.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <div className="font-medium text-sm text-[#1B3A4B]">{p.name}</div>
                <div className="text-xs text-gray-500">{p.gender} · {p.age || "?"} · {p.city || ""}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Recent Matches</h2>
            <Link href="/matches" className="text-sm text-[#6B8E9B] hover:underline">View all →</Link>
          </div>
          {recentMatches.length === 0 && <p className="text-gray-400 text-sm">No matches yet.</p>}
          {recentMatches.map((m: any) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[m.status] || "#888" }} />
              <div>
                <div className="text-sm"><span className="font-medium text-[#1B3A4B]">{m.boy_profile?.name}</span> <span className="text-gray-400">&</span> <span className="font-medium text-[#C4956A]">{m.girl_profile?.name}</span></div>
                <div className="text-xs text-gray-500">{m.status}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
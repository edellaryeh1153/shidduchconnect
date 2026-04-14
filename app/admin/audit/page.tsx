"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export default function AuditLogPage() {
  const { appUser } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("audit_log")
        .select("*, user:users!user_id(name)")
        .order("created_at", { ascending: false }).limit(200);
      setEntries(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (appUser?.role !== "admin") return <AppShell><p className="text-gray-500">Admin access required.</p></AppShell>;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Audit Log</h1>
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <p className="text-sm text-gray-500 mb-4">All logins, profile changes, and match updates are tracked here.</p>
        {loading ? <p className="text-gray-400">Loading...</p> : (
          <div className="max-h-[600px] overflow-y-auto">
            {entries.length === 0 && <p className="text-gray-400">No activity yet.</p>}
            {entries.map((e) => (
              <div key={e.id} className="py-2 border-b border-gray-100 last:border-0 text-sm">
                <span className="text-xs text-gray-400 mr-3">{new Date(e.created_at).toLocaleString()}</span>
                <span className="font-medium text-[#1B3A4B] mr-2">{e.user?.name || "Unknown"}</span>
                <span className="text-gray-600">{e.action}</span>
                {e.details && <span className="text-xs text-gray-400 ml-2">{JSON.stringify(e.details)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export default function AdminUsersPage() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: true });
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeRole(userId: string, role: string) {
    await supabase.from("users").update({ role }).eq("id", userId);
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "changed_user_role", target_id: userId, details: { role } });
    load();
  }

  async function toggleActive(userId: string, currentlyActive: boolean) {
    await supabase.from("users").update({ is_active: !currentlyActive }).eq("id", userId);
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: currentlyActive ? "deactivated_user" : "activated_user", target_id: userId });
    load();
  }

  if (appUser?.role !== "admin") return <AppShell><p className="text-gray-500">Admin access required.</p></AppShell>;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Manage Users</h1>
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <p className="text-sm text-gray-500 mb-4">Manage shadchan accounts. Deactivated users cannot log in.</p>
        {loading ? <p className="text-gray-400">Loading...</p> : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-[#1B3A4B]">
                    {u.name} {u.id === appUser?.id && <span className="text-xs text-gray-400">(you)</span>}
                  </div>
                  <div className="text-xs text-gray-500">{u.email} · Joined {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                    disabled={u.id === appUser?.id}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-[#C4956A] disabled:opacity-50">
                    <option value="admin">Admin</option>
                    <option value="shadchan">Shadchan</option>
                    <option value="viewer">Read Only</option>
                  </select>
                  {u.id !== appUser?.id && (
                    <button onClick={() => toggleActive(u.id, u.is_active)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${u.is_active ? "border-red-300 text-red-600 hover:bg-red-50" : "border-green-300 text-green-600 hover:bg-green-50"}`}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  )}
                  <div className={`w-2.5 h-2.5 rounded-full ${u.is_active ? "bg-green-500" : "bg-red-400"}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
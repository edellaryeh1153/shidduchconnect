"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export default function AdminUsersPage() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("shadchan");

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editResetPw, setEditResetPw] = useState("");

  async function load() {
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: true });
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function showMsg(text: string, type: "success" | "error") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  }

  async function createUser() {
    if (!newEmail || !newPassword || !newName) { showMsg("All fields are required.", "error"); return; }
    if (newPassword.length < 6) { showMsg("Password must be at least 6 characters.", "error"); return; }

    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: { data: { name: newName } },
    });

    if (error) { showMsg(error.message, "error"); return; }

    if (data.user && newRole !== "shadchan") {
      await supabase.from("users").update({ role: newRole }).eq("id", data.user.id);
    }
    if (data.user) {
      await supabase.from("users").update({ name: newName }).eq("id", data.user.id);
    }
    if (data.user) {
      try { await supabase.rpc("admin_confirm_user", { user_id: data.user.id }); } catch {}
    }

    await supabase.from("audit_log").insert({
      user_id: appUser!.id, action: "created_user",
      details: { email: newEmail, role: newRole, name: newName },
    });

    showMsg(`User ${newName} (${newEmail}) created successfully!`, "success");
    setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("shadchan");
    setShowCreate(false);
    load();
  }

  async function changeRole(userId: string, role: string) {
    await supabase.from("users").update({ role }).eq("id", userId);
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "changed_role", target_id: userId, details: { role } });
    showMsg("Role updated.", "success");
    load();
  }

  async function toggleActive(userId: string, currentlyActive: boolean) {
    await supabase.from("users").update({ is_active: !currentlyActive }).eq("id", userId);
    await supabase.from("audit_log").insert({
      user_id: appUser!.id,
      action: currentlyActive ? "deactivated_user" : "activated_user",
      target_id: userId,
    });
    showMsg(currentlyActive ? "User deactivated." : "User activated.", "success");
    load();
  }

  async function sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { showMsg(error.message, "error"); return; }
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "sent_password_reset", details: { email } });
    showMsg(`Password reset email sent to ${email}`, "success");
  }

  async function forceResetPassword(userId: string, newPw: string) {
    if (!newPw || newPw.length < 6) { showMsg("Password must be at least 6 characters.", "error"); return; }
    let error = null;
    try {
      const result = await supabase.rpc("admin_reset_password", { target_user_id: userId, new_password: newPw });
      error = result.error;
    } catch {
      error = { message: "RPC not available. Run the SQL function first." };
    }
    if (error) {
      showMsg(typeof error === "object" && "message" in error ? (error as any).message : "Password reset failed.", "error");
      return;
    }
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "force_reset_password", target_id: userId });
    showMsg("Password reset successfully.", "success");
    setEditResetPw("");
  }

  async function updateUserName(userId: string, name: string) {
    if (!name.trim()) return;
    await supabase.from("users").update({ name: name.trim() }).eq("id", userId);
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "updated_user_name", target_id: userId, details: { name } });
    showMsg("Name updated.", "success");
    setEditingUser(null);
    load();
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Permanently delete user ${email}? This cannot be undone. Their profiles will remain but will be unowned.`)) return;
    await supabase.from("users").delete().eq("id", userId);
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "deleted_user", details: { email } });
    showMsg(`User ${email} deleted.`, "success");
    load();
  }

  function startEdit(u: any) {
    setEditingUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditResetPw("");
  }

  if (appUser?.role !== "admin") return <AppShell><p className="text-gray-500">Admin access required.</p></AppShell>;

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/30 bg-white";
  const lbl = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Manage Users</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63] transition-colors">
          {showCreate ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${messageType === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message}
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-[#1B3A4B] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Create New User</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Full Name *</label><input className={inp} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Shadchan name" /></div>
            <div><label className={lbl}>Email *</label><input className={inp} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" /></div>
            <div><label className={lbl}>Password *</label><input className={inp} type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" /></div>
            <div>
              <label className={lbl}>Role</label>
              <select className={inp} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="admin">Admin — full access</option>
                <option value="shadchan">Shadchan — create, edit, match</option>
                <option value="viewer">Read Only — view only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={createUser} className="px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63]">Create User</button>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="bg-white rounded-xl p-5 border-2 border-[#C4956A] mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Editing: {editingUser.email}
            </h2>
            <button onClick={() => setEditingUser(null)} className="text-sm text-gray-500 hover:text-gray-700">✕ Close</button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={lbl}>Display Name</label>
              <div className="flex gap-2">
                <input className={inp} value={editName} onChange={(e) => setEditName(e.target.value)} />
                <button onClick={() => updateUserName(editingUser.id, editName)} className="px-4 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm shrink-0">Save</button>
              </div>
            </div>
            <div>
              <label className={lbl}>Role</label>
              <select className={inp} value={editRole} onChange={(e) => { setEditRole(e.target.value); changeRole(editingUser.id, e.target.value); }}
                disabled={editingUser.id === appUser?.id}>
                <option value="admin">Admin</option>
                <option value="shadchan">Shadchan</option>
                <option value="viewer">Read Only</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-[#1B3A4B] mb-3">Password Management</h3>
            <div className="flex gap-3 mb-3">
              <button onClick={() => sendPasswordReset(editingUser.email)}
                className="px-4 py-2 text-sm border border-[#6B8E9B] text-[#6B8E9B] rounded-lg hover:bg-gray-50">
                Send Reset Email
              </button>
            </div>
            <div className="flex gap-2">
              <input className={inp} type="text" value={editResetPw} onChange={(e) => setEditResetPw(e.target.value)} placeholder="Enter new password (min 6 chars)" />
              <button onClick={() => forceResetPassword(editingUser.id, editResetPw)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm shrink-0 hover:bg-amber-700">
                Force Reset
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Force reset sets the password directly without an email.</p>
          </div>

          {editingUser.id !== appUser?.id && (
            <div className="border-t border-red-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
              <div className="flex gap-3">
                <button onClick={() => toggleActive(editingUser.id, editingUser.is_active)}
                  className={`px-4 py-2 text-sm rounded-lg border ${editingUser.is_active ? "border-red-300 text-red-600 hover:bg-red-50" : "border-green-300 text-green-600 hover:bg-green-50"}`}>
                  {editingUser.is_active ? "Deactivate Account" : "Reactivate Account"}
                </button>
                <button onClick={() => deleteUser(editingUser.id, editingUser.email)}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Delete User Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center text-xs text-gray-500 uppercase tracking-wide font-medium">
          <div className="flex-1">User</div>
          <div className="w-32">Role</div>
          <div className="w-36">Last Login</div>
          <div className="w-24">Status</div>
          <div className="w-24 text-right">Actions</div>
        </div>
        {loading ? <div className="p-5 text-gray-400">Loading...</div> : (
          <div>
            {users.map((u) => (
              <div key={u.id} className={`px-5 py-3 border-b border-gray-100 last:border-0 flex items-center hover:bg-gray-50 ${editingUser?.id === u.id ? "bg-[#C4956A]/5" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[#1B3A4B] truncate">
                    {u.name}
                    {u.id === appUser?.id && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{u.email}</div>
                </div>
                <div className="w-32">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    u.role === "admin" ? "bg-purple-100 text-purple-700" :
                    u.role === "shadchan" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {u.role === "admin" ? "Admin" : u.role === "shadchan" ? "Shadchan" : "Read Only"}
                  </span>
                </div>
                <div className="w-36 text-xs text-gray-500">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() + " " + new Date(u.last_login).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Never"}
                </div>
                <div className="w-24">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${u.is_active ? "bg-green-500" : "bg-red-400"}`} />
                    <span className="text-xs text-gray-500">{u.is_active ? "Active" : "Disabled"}</span>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <button onClick={() => startEdit(u)} className="text-xs text-[#C4956A] hover:underline font-medium">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-gray-400">
        <span>{users.length} total users</span>
        <span>{users.filter((u) => u.role === "admin").length} admins</span>
        <span>{users.filter((u) => u.role === "shadchan").length} shadchanim</span>
        <span>{users.filter((u) => !u.is_active).length} disabled</span>
      </div>
    </AppShell>
  );
}
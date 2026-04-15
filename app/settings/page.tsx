"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  const { appUser } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [editName, setEditName] = useState(appUser?.name || "");
  const [nameSaving, setNameSaving] = useState(false);

  function showMsg(text: string, type: "success" | "error") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 6) { showMsg("New password must be at least 6 characters.", "error"); return; }
    if (newPw !== confirmPw) { showMsg("Passwords do not match.", "error"); return; }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPw });

    if (error) {
      showMsg(error.message, "error");
      setLoading(false);
      return;
    }

    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "changed_own_password" });
    showMsg("Password updated successfully!", "success");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setLoading(false);
  }

  async function handleUpdateName() {
    if (!editName.trim()) return;
    setNameSaving(true);
    await supabase.from("users").update({ name: editName.trim() }).eq("id", appUser!.id);
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "updated_own_name", details: { name: editName.trim() } });
    showMsg("Name updated. Refresh to see changes in sidebar.", "success");
    setNameSaving(false);
  }

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/30 bg-white";
  const lbl = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Settings</h1>

      {message && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${messageType === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6 max-w-xl">
        <h2 className="text-lg font-semibold text-[#1B3A4B] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Account Information</h2>
        <div className="space-y-3">
          <div>
            <label className={lbl}>Email</label>
            <div className="text-sm text-gray-700 py-2">{appUser?.email}</div>
          </div>
          <div>
            <label className={lbl}>Role</label>
            <div className="text-sm text-gray-700 py-2 capitalize">{appUser?.role}</div>
          </div>
          <div>
            <label className={lbl}>Display Name</label>
            <div className="flex gap-2">
              <input className={inp} value={editName} onChange={(e) => setEditName(e.target.value)} />
              <button onClick={handleUpdateName} disabled={nameSaving} className="px-4 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm shrink-0 disabled:opacity-50">
                {nameSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 max-w-xl">
        <h2 className="text-lg font-semibold text-[#1B3A4B] mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className={lbl}>New Password</label>
            <input className={inp} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 6 characters" required />
          </div>
          <div>
            <label className={lbl}>Confirm New Password</label>
            <input className={inp} type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Type password again" required />
          </div>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63] disabled:opacity-50">
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
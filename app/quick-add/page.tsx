"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { HASHKAFOS } from "@/types";

export default function QuickAddPage() {
  const { appUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    name: "", gender: "Girl", age: "", city: "", hashkafa: "", phone: "", notes: "",
  });
  const set = (key: string, val: string) => setF((p) => ({ ...p, [key]: val }));

  async function handleSave() {
    if (!f.name.trim()) { setError("Name is required."); return; }
    if (!appUser) return;
    setSaving(true); setError("");

    const { error: err } = await supabase.from("profiles").insert({
      created_by: appUser.id, name: f.name.trim(), gender: f.gender,
      age: f.age ? parseInt(f.age) : null, city: f.city, hashkafa: f.hashkafa,
      personal_phone: f.phone, notes: f.notes,
    });

    if (err) { setError(err.message); setSaving(false); return; }

    await supabase.from("audit_log").insert({ user_id: appUser.id, action: "quick_add_profile", details: { name: f.name.trim() } });

    setSaved((prev) => [...prev, f.name.trim()]);
    setF({ name: "", gender: f.gender, age: "", city: "", hashkafa: "", phone: "", notes: "" });
    setSaving(false);
  }

  const inp = "w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#C4956A] focus:ring-2 focus:ring-[#C4956A]/10 bg-white";

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Quick Add</h1>
      <p className="text-sm text-gray-500 mb-6">Fast profile entry — capture the basics now, fill in details later. Great for events and phone calls.</p>

      <div className="grid grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Name *</label>
              <input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" autoFocus />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gender</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => set("gender", "Girl")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${f.gender === "Girl" ? "bg-[#C4956A] text-white border-[#C4956A]" : "bg-white text-gray-600 border-gray-300"}`}>
                    Girl
                  </button>
                  <button type="button" onClick={() => set("gender", "Boy")}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${f.gender === "Boy" ? "bg-[#1B3A4B] text-white border-[#1B3A4B]" : "bg-white text-gray-600 border-gray-300"}`}>
                    Boy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Age</label>
                <input className={inp} type="number" value={f.age} onChange={(e) => set("age", e.target.value)} placeholder="Age" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">City</label>
                <input className={inp} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Hashkafa</label>
                <select className={inp} value={f.hashkafa} onChange={(e) => set("hashkafa", e.target.value)}>
                  <option value="">Select...</option>
                  {HASHKAFOS.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</label>
              <input className={inp} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone number" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Quick Notes</label>
              <textarea className={inp + " min-h-[80px]"} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes — who referred them, first impression, what they're looking for..." />
            </div>

            <button onClick={handleSave} disabled={saving || !f.name.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-[#1B3A4B] to-[#244E63] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 text-[15px]">
              {saving ? "Saving..." : "Save & Add Another"}
            </button>

            <p className="text-xs text-gray-400 text-center">You can fill in the full details later from the Profiles page.</p>
          </div>
        </div>

        {/* Recently added */}
        <div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-[#1B3A4B] mb-3" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Just Added ({saved.length})
            </h2>
            {saved.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl text-gray-200 mb-2">◉</div>
                <p className="text-gray-400 text-sm">Profiles you add will show here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {saved.map((name, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                    <span className="text-green-600 text-sm">✓</span>
                    <span className="text-sm font-medium text-green-800">{name}</span>
                    <span className="text-xs text-green-600">saved</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {saved.length > 0 && (
            <div className="mt-4 flex gap-3">
              <a href="/profiles" className="flex-1 text-center py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1B3A4B] hover:bg-gray-50">
                View All Profiles →
              </a>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id);
      await supabase.from("audit_log").insert({ user_id: user.id, action: "login" });
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1B3A4B 0%, #234E5E 40%, #1B3A4B 100%)" }}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-5 bg-[#C4956A]" style={{ transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-5 bg-[#C4956A]" style={{ transform: "translate(-30%, 30%)" }} />

      <div className="w-full max-w-[420px] relative">
        {/* Card */}
        <div className="bg-white rounded-2xl p-10 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#C4956A] to-[#A87B52] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-5 shadow-lg">
              שׁ
            </div>
            <h1 className="text-3xl font-bold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              ShidduchConnect
            </h1>
            <p className="text-sm text-gray-400 mt-1">Professional Matchmaking Platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C4956A] focus:ring-2 focus:ring-[#C4956A]/10 bg-gray-50/50"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-[11px] text-[#C4956A] hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#C4956A] focus:ring-2 focus:ring-[#C4956A]/10 bg-gray-50/50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#1B3A4B] to-[#244E63] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#1B3A4B]/20 transition-all disabled:opacity-50 text-[15px]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-[#4A7080] mt-6">
          Secure matchmaking platform · All data encrypted
        </p>
      </div>
    </div>
  );
}
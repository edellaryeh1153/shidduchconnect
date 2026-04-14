"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #1B3A4B 0%, #2C5F6F 50%, #1B3A4B 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl p-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-[#C4956A] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">שׁ</div>
          <h1 className="text-3xl font-bold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Reset Password
          </h1>
          <p className="text-sm text-gray-500 mt-1">Enter your email and we will send you a reset link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-lg font-medium text-[#1B3A4B] mb-2">Check your email</p>
            <p className="text-sm text-gray-500 mb-6">We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.</p>
            <Link href="/login" className="text-sm text-[#C4956A] font-medium hover:underline">← Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/30"
                placeholder="your@email.com"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1B3A4B] text-white rounded-lg font-medium hover:bg-[#244E63] transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              <Link href="/login" className="text-[#C4956A] font-medium hover:underline">← Back to Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
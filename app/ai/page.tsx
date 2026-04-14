"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";

export default function AIPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusProfile, setFocusProfile] = useState("");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [p, m] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("matches").select("*, boy_profile:profiles!boy_profile_id(name), girl_profile:profiles!girl_profile_id(name), match_notes(note_text)"),
      ]);
      setProfiles(p.data || []);
      setMatches(m.data || []);
    }
    load();
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function buildContext() {
    const pList = profiles.map((p) =>
      `[${p.name}] ${p.gender}, ${p.age || "?"}yo, ${p.hashkafa || "?"}, ${p.height || "?"}, ${p.city || ""} ${p.state || ""}, ${p.occupation || "?"}. About: ${p.about || "N/A"}. Looking for: age ${p.preferences?.ageMin || "?"}-${p.preferences?.ageMax || "?"}, hashkafa: ${p.preferences?.hashkafa?.join("/") || "any"}`
    ).join("\n");
    const mList = matches.map((m: any) =>
      `${m.boy_profile?.name} & ${m.girl_profile?.name}: ${m.status}. Notes: ${(m.match_notes || []).map((n: any) => n.note_text).join(" | ") || "none"}`
    ).join("\n");
    return `You are an expert Shadchan AI assistant. You have deep knowledge of shidduchim, hashkafos, and what makes successful matches in the frum community.\n\nPROFILES:\n${pList || "(none)"}\n\nMATCHES:\n${mList || "(none)"}\n\nGive warm, professional, insightful advice. Reference specific profile details. Suggest 2-3 matches with reasoning when asked.`;
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const focused = focusProfile ? profiles.find((p) => p.id === focusProfile) : null;
    const prompt = focused ? `About ${focused.name} (${focused.gender}, ${focused.age || "?"}yo, ${focused.hashkafa}): ${input}` : input;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: buildContext(),
          messages: [...messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: prompt }],
        }),
      });
      const data = await resp.json();
      const aiText = data.content?.map((c: any) => c.text || "").join("\n") || "I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: aiText }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Connection error. Please try again." }]);
    }
    setLoading(false);
  }

  const suggestions = ["Who should I set up next?", "Suggest a match for the newest profile", "Who has been waiting longest?", "Analyze my top matches"];

  return (
    <AppShell>
      <div className="flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
        <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h1 className="text-xl font-bold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>✧ AI Shadchan Assistant</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Focus on:</span>
              <select value={focusProfile} onChange={(e) => setFocusProfile(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#C4956A]">
                <option value="">All profiles</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.gender})</option>)}
              </select>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">✧</div>
                <p className="text-lg text-[#1B3A4B] font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>AI-Powered Matchmaking Assistant</p>
                <p className="text-sm text-gray-500 mt-1 mb-6">Ask me to suggest matches, analyze compatibility, or get insights.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((q) => (
                    <button key={q} onClick={() => setInput(q)} className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-[#C4956A] transition-colors">{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#1B3A4B] text-white rounded-2xl rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm"
                }`}>{m.text}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-sm text-sm text-gray-400">Thinking...</div></div>}
            <div ref={chatEnd} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask the AI Shadchan..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]" />
            <button onClick={send} disabled={loading || !input.trim()} className="px-5 py-2.5 bg-[#1B3A4B] text-white rounded-lg text-sm font-medium hover:bg-[#244E63] disabled:opacity-50">Send</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
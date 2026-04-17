"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";

const FAQ = [
  {
    category: "Getting Started",
    items: [
      { q: "How do I add a new profile?", a: "Go to Profiles → click '+ Add Profile' in the top right. Fill in as much info as you have — you can always edit later. For fast entry at events, use the Quick Add page." },
      { q: "How does the AI Resume Reader work?", a: "On the Add Profile page, you'll see the AI Resume Reader at the top. Upload a PDF or Word shidduch resume, and the AI will automatically fill in the form fields. Review the filled data and adjust anything that needs fixing before saving." },
      { q: "What's the difference between the uploaded resume and the profile data?", a: "The uploaded resume is the actual file (PDF/Word) the boy or girl created themselves. You download this to send to families. The profile data is what YOU fill in as the shadchan — it stays in the system for your reference and matching." },
    ],
  },
  {
    category: "Profiles",
    items: [
      { q: "What does profile visibility mean?", a: "Private: only you can see this profile. Shared: only shadchanim you specifically choose can see it. Organization: all shadchanim in the system can see it." },
      { q: "How do I share a profile with another shadchan?", a: "Open the profile → click 'Share' → select a shadchan from the dropdown → click Share. They can now view the profile, photo, and resume but cannot edit or delete it." },
      { q: "What are tags for?", a: "Tags help you organize profiles. Mark someone as 'Priority', 'On Hold', 'VIP', etc. You can add preset tags or create custom ones. Tags are visible only to you." },
      { q: "How does the photo gallery work?", a: "Each profile can have multiple photos. The first photo uploaded becomes the 'Primary' photo shown in cards and lists. You can change which photo is primary and delete photos from the profile detail page." },
      { q: "What are the star/favorites for?", a: "Click the star (☆) on any profile to add it to your Watchlist. Access your watchlist from the sidebar. Great for keeping track of profiles you're actively working on." },
    ],
  },
  {
    category: "Matches",
    items: [
      { q: "How does the match workflow work?", a: "When you create a match, you choose who to contact first (boy or girl side). The match then follows steps: Sent → Response (Yes/No) → Sent to other side → Both Agreed → Dating → Engaged → Married. At each step you can add notes about what happened." },
      { q: "What are private notes?", a: "When adding a note to a match, check the '🔒 Private' checkbox. Only YOU can see private notes — they won't be visible to other shadchanim even if the match is shared." },
      { q: "How do I track dates?", a: "On a match that's in 'Dating' or 'Both Agreed' status, click '+ Schedule Date'. After the date, click 'Enter Feedback' to record what both sides said and whether they want another date." },
      { q: "Why record feedback when someone says no?", a: "This information is invaluable for future matches. Understanding WHY a match didn't work helps you make better suggestions next time — for both the boy and the girl." },
    ],
  },
  {
    category: "Recommendations & AI",
    items: [
      { q: "How does the compatibility score work?", a: "The system compares each person's preferences (age range, hashkafa, height, build, etc.) against the other person's actual attributes. It calculates both directions — does Person A match what Person B wants, AND does Person B match what Person A wants — then averages them." },
      { q: "What can the AI Shadchan do?", a: "The AI reads your entire database of profiles and match history. Ask it to suggest matches for a specific person, analyze compatibility between two people, identify singles who haven't been suggested recently, or help you think through a difficult matchmaking decision." },
      { q: "How do I get better AI suggestions?", a: "The more data you fill in on profiles — especially the 'About' description, 'What they're looking for', personality traits, and preferences — the better the AI and scoring algorithm can work." },
    ],
  },
  {
    category: "Security & Privacy",
    items: [
      { q: "Who can see my profiles?", a: "By default, only you. Profiles are set to 'Private' when created. You control sharing — nobody else can see your profiles unless you explicitly share them or set them to 'Organization' visibility." },
      { q: "Are resumes and photos secure?", a: "Yes. Files are stored in private storage buckets. Access requires authentication and is controlled by the same sharing rules as profiles. Download links expire after 1 hour." },
      { q: "What does the audit log track?", a: "Every login, profile view, profile edit, match creation, status change, sharing action, and note addition is logged with timestamp and user name. Admins can review this in the Admin panel." },
      { q: "How do I reset my password?", a: "Click 'Forgot password?' on the login page, enter your email, and follow the link in the email. Admins can also force-reset passwords from the Admin panel." },
    ],
  },
  {
    category: "Admin",
    items: [
      { q: "How do I add new shadchanim?", a: "Go to Admin → Manage Users → click '+ Create User'. Enter their name, email, password, and role. The first account created is always Admin." },
      { q: "What are the different roles?", a: "Admin: full access to everything including user management. Shadchan: can create profiles, make matches, add notes. Read Only: can view but not create or edit anything." },
      { q: "Can I deactivate a user without deleting them?", a: "Yes. In Manage Users, click 'Manage' on any user → 'Deactivate Account'. They won't be able to log in, but their data stays intact. You can reactivate them anytime." },
    ],
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchHelp, setSearchHelp] = useState("");

  const filtered = searchHelp.trim()
    ? FAQ.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.q.toLowerCase().includes(searchHelp.toLowerCase()) ||
          item.a.toLowerCase().includes(searchHelp.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : FAQ;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Help & FAQ</h1>
      <p className="text-sm text-gray-500 mb-6">Everything you need to know about using ShidduchConnect.</p>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">🔍</span>
          <input value={searchHelp} onChange={(e) => setSearchHelp(e.target.value)}
            placeholder="Search help articles..."
            className="w-full px-3 py-2 text-sm focus:outline-none" />
          {searchHelp && <button onClick={() => setSearchHelp("")} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
        </div>
      </div>

      {/* FAQ sections */}
      <div className="space-y-6">
        {filtered.map((category) => (
          <div key={category.category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{category.category}</h2>
            </div>
            <div>
              {category.items.map((item, i) => {
                const key = `${category.category}-${i}`;
                const isOpen = openIndex === key;
                return (
                  <div key={key} className="border-b border-gray-50 last:border-0">
                    <button onClick={() => setOpenIndex(isOpen ? null : key)}
                      className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-[#1B3A4B] pr-4">{item.q}</span>
                      <span className={`text-gray-400 text-lg transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4">
                        <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <p className="text-gray-400">No help articles match your search.</p>
        </div>
      )}
    </AppShell>
  );
}
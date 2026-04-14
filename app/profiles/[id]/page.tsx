"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth, canDo } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { SCHOOLS_GIRL, SCHOOLS_BOY, STATUS_COLORS } from "@/types";

export default function ProfileDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { appUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [shareWith, setShareWith] = useState("");
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [resumeDownloadUrl, setResumeDownloadUrl] = useState("");

  async function load() {
    const { data: p } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (p) {
      setProfile(p);

      // Get signed photo URL
      if (p.photo_url) {
        const { data: photoData } = await supabase.storage.from("photos").createSignedUrl(p.photo_url, 3600);
        if (photoData?.signedUrl) setPhotoUrl(photoData.signedUrl);
      }

      // Get signed resume URL (only if viewer has access — RLS enforces this)
      if (p.resume_url) {
        const { data: resumeData } = await supabase.storage.from("resumes").createSignedUrl(p.resume_url, 3600);
        if (resumeData?.signedUrl) setResumeDownloadUrl(resumeData.signedUrl);
      }

      const [mRes, sRes, uRes] = await Promise.all([
        supabase.from("matches")
          .select("*, boy_profile:profiles!boy_profile_id(name), girl_profile:profiles!girl_profile_id(name), match_notes(id, note_text, note_type, created_at)")
          .or(`boy_profile_id.eq.${id},girl_profile_id.eq.${id}`)
          .order("created_at", { ascending: false }),
        supabase.from("profile_shares").select("*, shared_with_user:users!shared_with(name, email)").eq("profile_id", id),
        supabase.from("users").select("id, name, email"),
      ]);
      setMatches(mRes.data || []);
      setShares(sRes.data || []);
      setAllUsers(uRes.data || []);
    }
    setLoading(false);
    if (appUser) {
      await supabase.from("audit_log").insert({ user_id: appUser.id, action: "viewed_profile", target_type: "profile", target_id: id as string });
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this profile and all related matches? This cannot be undone.")) return;
    // Delete files from storage
    if (profile.photo_url) await supabase.storage.from("photos").remove([profile.photo_url]);
    if (profile.resume_url) await supabase.storage.from("resumes").remove([profile.resume_url]);
    await supabase.from("profiles").delete().eq("id", id);
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "deleted_profile", details: { name: profile.name } });
    router.push("/profiles");
  }

  async function handleShare() {
    if (!shareWith || !appUser) return;
    await supabase.from("profile_shares").insert({ profile_id: id, shared_by: appUser.id, shared_with: shareWith });
    await supabase.from("audit_log").insert({ user_id: appUser.id, action: "shared_profile", target_id: id as string, details: { shared_with: shareWith } });
    setShareWith("");
    load();
  }

  async function removeShare(shareId: string) {
    await supabase.from("profile_shares").delete().eq("id", shareId);
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "revoked_share", target_id: id as string });
    load();
  }

  if (loading) return <AppShell><p className="text-gray-400">Loading...</p></AppShell>;
  if (!profile) return <AppShell><p className="text-gray-500">Profile not found.</p></AppShell>;

  const isGirl = profile.gender === "Girl" || profile.gender === "girl";
  const isOwner = profile.created_by === appUser?.id;
  const isAdmin = appUser?.role === "admin";
  const schoolList = isGirl ? SCHOOLS_GIRL : SCHOOLS_BOY;

  const personalInfo = [
    ["Age", profile.age ? `${profile.age}${profile.date_of_birth ? ` (DOB: ${new Date(profile.date_of_birth).toLocaleDateString()})` : ""}` : null],
    ["Height", profile.height], ["Hair", profile.hair_color], ["Eyes", profile.eye_color],
    ["Skin Tone", profile.skin_tone], ["Build", profile.build],
    ["Location", [profile.city, profile.state].filter(Boolean).join(", ")],
    ["Where Looking to Live", profile.where_to_live], ["Occupation", profile.occupation],
    ["Personal Phone", profile.personal_phone],
  ].filter(([, v]) => v);

  const religiousInfo = [
    ["Hashkafa", profile.hashkafa], ["Learning Status", profile.learning_status],
    ["Shul", profile.shul], ["Rav / Rabbi", profile.rav],
    ["Smoking", profile.smoking], ["Camp", profile.camp], ["Languages", profile.languages],
  ].filter(([, v]) => v);

  const familyDetails = [
    ["Siblings", profile.num_siblings != null ? `${profile.num_siblings}${profile.position_in_family ? ` (${profile.position_in_family})` : ""}` : null],
    ["Father", profile.father_name ? `${profile.father_name}${profile.father_phone ? ` — ${profile.father_phone}` : ""}` : null],
    ["Mother", profile.mother_name ? `${profile.mother_name}${profile.mother_phone ? ` — ${profile.mother_phone}` : ""}` : null],
  ].filter(([, v]) => v);

  const statusInfo = [
    ["Ready to Date", profile.ready_to_date],
    ["Available From", profile.date_available ? new Date(profile.date_available).toLocaleDateString() : null],
    ["Visibility", profile.profile_visibility === "private" ? "🔒 Private" : profile.profile_visibility === "shared" ? "👥 Shared" : "🏢 Organization"],
  ].filter(([, v]) => v);

  const availableToShare = allUsers.filter(
    (u) => u.id !== appUser?.id && !shares.find((s) => s.shared_with === u.id)
  );

  const secTitle = "text-base font-semibold text-[#1B3A4B] border-b pb-1 mb-3";

  function InfoGrid({ items }: { items: (string | null)[][] }) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {items.map(([k, v]) => (
          <div key={k as string}>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">{k}</div>
            <div className="text-sm font-medium">{v}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <AppShell>
      <button onClick={() => router.push("/profiles")} className="text-sm text-[#6B8E9B] hover:underline mb-4 block">← Back to Profiles</button>
      <div className="bg-white rounded-xl p-6 border border-gray-200 max-w-4xl">

        {/* Header with photo */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img src={photoUrl} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold ${isGirl ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                {profile.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#1B3A4B]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{profile.name}</h1>
              <p className="text-sm text-gray-500">
                {profile.gender} · {profile.hashkafa}
                {profile.ready_to_date && profile.ready_to_date !== "Yes" ? ` · ${profile.ready_to_date}` : ""}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {profile.profile_visibility === "private" ? "🔒 Private profile" : profile.profile_visibility === "shared" ? "👥 Shared profile" : "🏢 Organization-wide"}
              </p>
            </div>
          </div>
          {(isOwner || isAdmin) && (
            <div className="flex gap-2">
              <button onClick={() => setShowShare(!showShare)} className="px-4 py-2 text-sm border border-[#6B8E9B] text-[#6B8E9B] rounded-lg hover:bg-gray-50">Share</button>
              <Link href={`/profiles/${id}/edit`} className="px-4 py-2 text-sm border border-[#1B3A4B] text-[#1B3A4B] rounded-lg hover:bg-gray-50">Edit</Link>
              <button onClick={handleDelete} className="px-4 py-2 text-sm border border-red-400 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
            </div>
          )}
        </div>

        {/* Share panel */}
        {showShare && (isOwner || isAdmin) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-[#1B3A4B] mb-1">Share this profile</h4>
            <p className="text-xs text-gray-500 mb-3">Shared shadchanim can view this profile, its photo, and resume. Only you can edit or delete it.</p>
            <div className="flex gap-2 mb-3">
              <select value={shareWith} onChange={(e) => setShareWith(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Select a shadchan...</option>
                {availableToShare.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
              <button onClick={handleShare} disabled={!shareWith} className="px-4 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm disabled:opacity-50">Share</button>
            </div>
            {shares.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Currently shared with:</p>
                {shares.map((s) => (
                  <div key={s.id} className="flex justify-between items-center py-1">
                    <span className="text-sm">{s.shared_with_user?.name} ({s.shared_with_user?.email})</span>
                    <button onClick={() => removeShare(s.id)} className="text-xs text-red-500 hover:underline">Revoke</button>
                  </div>
                ))}
              </div>
            )}
            {shares.length === 0 && <p className="text-xs text-gray-400">Not shared with anyone yet.</p>}
          </div>
        )}

        {/* Resume download */}
        {resumeDownloadUrl && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#1B3A4B]">📄 Shidduch Resume Attached</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {isOwner ? "Only you and shadchanim you share with can access this." : "Shared with you by the profile owner."}
              </div>
            </div>
            <a href={resumeDownloadUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm hover:bg-[#244E63] transition-colors">
              Download Resume
            </a>
          </div>
        )}

        {/* Info sections */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Personal Information</h3>
            <InfoGrid items={personalInfo} />
          </div>
          <div>
            <h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Religious & Lifestyle</h3>
            <InfoGrid items={religiousInfo} />
          </div>
        </div>

        {/* Family */}
        {(familyDetails.length > 0 || profile.family_info) && (
          <div className="mb-6">
            <h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Family</h3>
            <InfoGrid items={familyDetails} />
            {profile.family_info && <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2">{profile.family_info}</p>}
          </div>
        )}

        {/* Education */}
        <div className="mb-6">
          <h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Education</h3>
          <div className="grid grid-cols-2 gap-3">
            {schoolList.filter((s) => (profile.schools || {})[s.key]).map((s) => (
              <div key={s.key}><div className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</div><div className="text-sm font-medium">{profile.schools[s.key]}</div></div>
            ))}
          </div>
          {schoolList.filter((s) => (profile.schools || {})[s.key]).length === 0 && <p className="text-gray-400 text-sm">No schools entered.</p>}
        </div>

        {/* Dating Status */}
        {statusInfo.length > 0 && (
          <div className="mb-6">
            <h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Dating Status</h3>
            <InfoGrid items={statusInfo} />
          </div>
        )}

        {/* Personality */}
        {(profile.personality_traits?.length > 0 || profile.about || profile.looking_for_description) && (
          <div className="mb-6">
            <h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Personality & Description</h3>
            {profile.personality_traits?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {profile.personality_traits.map((t: string) => (
                  <span key={t} className="px-3 py-1 rounded-full text-xs bg-[#1B3A4B]/10 text-[#1B3A4B] border border-[#1B3A4B]/20">{t}</span>
                ))}
              </div>
            )}
            {profile.about && <div className="mb-3"><div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">About</div><p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.about}</p></div>}
            {profile.looking_for_description && <div><div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">What They Are Looking For</div><p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.looking_for_description}</p></div>}
          </div>
        )}

        {/* References */}
        {profile.references && <div className="mb-6"><h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>References</h3><p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.references}</p></div>}

        {/* Private Shadchan Notes — only visible to owner */}
        {profile.notes && isOwner && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">🔒 Your Private Notes</h3>
            <p className="text-xs text-amber-700 mb-2">Only you can see these notes. They are not shared even when the profile is shared.</p>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">{profile.notes}</p>
          </div>
        )}

        {/* Preferences */}
        {profile.preferences && Object.values(profile.preferences).some(Boolean) && (
          <div className="mb-6">
            <h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Match Preferences</h3>
            <div className="grid grid-cols-2 gap-3">
              {profile.preferences.ageMin && <div><div className="text-[10px] text-gray-400 uppercase tracking-wider">Age Range</div><div className="text-sm font-medium">{profile.preferences.ageMin}–{profile.preferences.ageMax}</div></div>}
              {profile.preferences.heightMin && <div><div className="text-[10px] text-gray-400 uppercase tracking-wider">Height Range</div><div className="text-sm font-medium">{profile.preferences.heightMin}–{profile.preferences.heightMax}</div></div>}
              {profile.preferences.hashkafa?.length > 0 && <div><div className="text-[10px] text-gray-400 uppercase tracking-wider">Hashkafa</div><div className="text-sm font-medium">{profile.preferences.hashkafa.join(", ")}</div></div>}
              {profile.preferences.build?.length > 0 && <div><div className="text-[10px] text-gray-400 uppercase tracking-wider">Build</div><div className="text-sm font-medium">{profile.preferences.build.join(", ")}</div></div>}
              {profile.preferences.hairColor?.length > 0 && <div><div className="text-[10px] text-gray-400 uppercase tracking-wider">Hair</div><div className="text-sm font-medium">{profile.preferences.hairColor.join(", ")}</div></div>}
              {profile.preferences.learningStatus?.length > 0 && <div><div className="text-[10px] text-gray-400 uppercase tracking-wider">Learning Status</div><div className="text-sm font-medium">{profile.preferences.learningStatus.join(", ")}</div></div>}
              {profile.preferences.smoking && <div><div className="text-[10px] text-gray-400 uppercase tracking-wider">Smoking</div><div className="text-sm font-medium">{profile.preferences.smoking === "No" ? "Non-smoker only" : "Open to smoker"}</div></div>}
            </div>
            {profile.preferences.notes && <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{profile.preferences.notes}</p>}
          </div>
        )}

        {/* Match History */}
        <div className="mt-6">
          <h3 className={secTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Match History ({matches.length})</h3>
          {matches.length === 0 && <p className="text-gray-400 text-sm">No matches yet.</p>}
          {matches.map((m) => {
            const otherName = m.boy_profile_id === id ? m.girl_profile?.name : m.boy_profile?.name;
            const noteCount = m.match_notes?.length || 0;
            const lastNote = m.match_notes?.[m.match_notes.length - 1];
            return (
              <Link key={m.id} href={`/matches/${m.id}`} className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[m.status] || "#888" }} />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="font-medium">with {otherName}</span>
                      <span className="text-gray-400 ml-2">· {m.status}</span>
                      <span className="text-gray-400 ml-2">· {noteCount} note{noteCount !== 1 ? "s" : ""}</span>
                    </div>
                    {lastNote && lastNote.note_type !== "status_change" && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">Last note: {lastNote.note_text}</div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
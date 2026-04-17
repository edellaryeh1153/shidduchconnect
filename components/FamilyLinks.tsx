"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Props = {
  profileId: string;
  profileName: string;
  canEdit: boolean;
};

export default function FamilyLinks({ profileId, profileName, canEdit }: Props) {
  const { appUser } = useAuth();
  const [links, setLinks] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [relationship, setRelationship] = useState("sibling");

  async function load() {
    // Get links where this profile is either side
    const { data: links1 } = await supabase.from("family_links")
      .select("id, relationship, related_profile_id, profile:profiles!related_profile_id(id, name, gender, age, city)")
      .eq("profile_id", profileId);

    const { data: links2 } = await supabase.from("family_links")
      .select("id, relationship, profile_id, profile:profiles!profile_id(id, name, gender, age, city)")
      .eq("related_profile_id", profileId);

    const combined = [
      ...(links1 || []).map((l: any) => ({ ...l, linked_profile: l.profile, direction: "outgoing" })),
      ...(links2 || []).map((l: any) => ({ ...l, linked_profile: l.profile, direction: "incoming" })),
    ];
    setLinks(combined);

    const { data: profiles } = await supabase.from("profiles").select("id, name, gender, age, city").order("name");
    const existingIds = combined.map((l: any) => l.linked_profile?.id).filter(Boolean);
    setAllProfiles((profiles || []).filter((p: any) => p.id !== profileId && !existingIds.includes(p.id)));
  }

  useEffect(() => { load(); }, [profileId]);

  async function addLink() {
    if (!selectedId || !appUser) return;
    await supabase.from("family_links").insert({
      profile_id: profileId, related_profile_id: selectedId,
      relationship, created_by: appUser.id,
    });
    await supabase.from("audit_log").insert({
      user_id: appUser.id, action: "added_family_link",
      details: { profile: profileId, related: selectedId, relationship },
    });
    setSelectedId("");
    setShowAdd(false);
    load();
  }

  async function removeLink(linkId: string) {
    await supabase.from("family_links").delete().eq("id", linkId);
    load();
  }

  const relationships: Record<string, string> = {
    sibling: "Sibling",
    parent: "Parent",
    child: "Child",
    cousin: "Cousin",
    in_law: "In-law",
    other: "Other relative",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-[#1B3A4B] border-b pb-1 flex-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Family in System ({links.length})
        </h3>
        {canEdit && (
          <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-[#C4956A] hover:underline ml-3">
            {showAdd ? "Cancel" : "+ Link Family"}
          </button>
        )}
      </div>

      {showAdd && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
          <p className="text-xs text-gray-500 mb-2">Connect {profileName} to a sibling or relative already in the system.</p>
          <div className="flex gap-2 mb-2">
            <select value={relationship} onChange={(e) => setRelationship(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] w-32">
              {Object.entries(relationships).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A]">
              <option value="">Select a profile...</option>
              {allProfiles.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.gender}, {p.age || "?"}, {p.city || "?"})</option>)}
            </select>
            <button onClick={addLink} disabled={!selectedId} className="px-4 py-2 bg-[#1B3A4B] text-white rounded-lg text-sm disabled:opacity-50">Link</button>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <p className="text-gray-400 text-sm">No family members linked in the system.</p>
      ) : (
        <div className="space-y-2">
          {links.map((l) => (
            <div key={l.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <Link href={`/profiles/${l.linked_profile?.id}`} className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${l.linked_profile?.gender === "Girl" ? "bg-[#C4956A]" : "bg-[#1B3A4B]"}`}>
                  {l.linked_profile?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#1B3A4B]">{l.linked_profile?.name}</div>
                  <div className="text-xs text-gray-500">
                    {relationships[l.relationship] || l.relationship} · {l.linked_profile?.gender} · {l.linked_profile?.age || "?"} · {l.linked_profile?.city || "?"}
                  </div>
                </div>
              </Link>
              {canEdit && (
                <button onClick={() => removeLink(l.id)} className="text-xs text-red-400 hover:text-red-600 ml-2">Remove</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
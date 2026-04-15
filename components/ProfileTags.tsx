"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

const PRESET_TAGS = [
  { label: "Priority", color: "#C4956A" },
  { label: "New", color: "#6B8E9B" },
  { label: "On Hold", color: "#8B7355" },
  { label: "Ready", color: "#5C8A5C" },
  { label: "Needs Info", color: "#9B7CB8" },
  { label: "Follow Up", color: "#C4956A" },
  { label: "Hot Lead", color: "#E07B5B" },
  { label: "VIP", color: "#D4A853" },
];

type Props = {
  profileId: string;
  tags: string[];
  canEdit: boolean;
  onUpdate: (tags: string[]) => void;
};

export default function ProfileTags({ profileId, tags, canEdit, onUpdate }: Props) {
  const [customTag, setCustomTag] = useState("");

  async function toggleTag(tag: string) {
    if (!canEdit) return;
    const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    await supabase.from("profiles").update({ tags: newTags }).eq("id", profileId);
    onUpdate(newTags);
  }

  async function addCustom() {
    if (!customTag.trim() || !canEdit) return;
    const newTags = [...tags, customTag.trim()];
    await supabase.from("profiles").update({ tags: newTags }).eq("id", profileId);
    onUpdate(newTags);
    setCustomTag("");
  }

  function getColor(tag: string) {
    const preset = PRESET_TAGS.find((p) => p.label === tag);
    return preset?.color || "#888";
  }

  return (
    <div>
      {/* Current tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.length === 0 && <span className="text-xs text-gray-400">No tags</span>}
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white font-medium" style={{ background: getColor(tag) }}>
            {tag}
            {canEdit && (
              <button onClick={() => toggleTag(tag)} className="hover:text-gray-200 ml-0.5">✕</button>
            )}
          </span>
        ))}
      </div>

      {/* Add tags */}
      {canEdit && (
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {PRESET_TAGS.filter((p) => !tags.includes(p.label)).map((p) => (
              <button key={p.label} onClick={() => toggleTag(p.label)}
                className="px-2 py-0.5 rounded-full text-[10px] border border-gray-300 text-gray-500 hover:border-gray-400 transition-colors">
                + {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <input value={customTag} onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              placeholder="Custom tag..."
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#C4956A] w-32" />
            <button onClick={addCustom} className="px-2 py-1 text-xs text-[#C4956A] hover:underline">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
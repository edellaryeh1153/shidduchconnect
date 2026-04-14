"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import {
  HAIR_COLORS, SKIN_TONES, EYE_COLORS, HASHKAFOS, BUILDS, HEIGHTS,
  SCHOOLS_GIRL, SCHOOLS_BOY, LEARNING_STATUSES, SMOKING_OPTIONS,
  POSITION_OPTIONS, READY_OPTIONS, PERSONALITY_TRAITS, LANGUAGES,
} from "@/types";

export default function NewProfilePage() {
  const router = useRouter();
  const { appUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [f, setF] = useState({
    name: "", gender: "Girl", dateOfBirth: "", height: "", hairColor: "", eyeColor: "",
    skinTone: "", build: "", hashkafa: "", city: "", state: "", occupation: "",
    learningStatus: "", smoking: "", numSiblings: "", positionInFamily: "",
    whereToLive: "", shul: "", rav: "", camp: "", languages: [] as string[],
    personalityTraits: [] as string[], lookingForDescription: "",
    readyToDate: "Yes", dateAvailable: "", profileVisibility: "private",
    about: "", familyInfo: "", references: "", resume: "",
    personalPhone: "", motherName: "", motherPhone: "", fatherName: "", fatherPhone: "", notes: "",
    schools: {} as Record<string, string>,
    prefAgeMin: "", prefAgeMax: "", prefHeightMin: "", prefHeightMax: "",
    prefHashkafa: [] as string[], prefHair: [] as string[], prefBuild: [] as string[],
    prefLearning: [] as string[], prefSmoking: "", prefNotes: "",
  });
  const set = (key: string, val: any) => setF((p) => ({ ...p, [key]: val }));
  const toggleArr = (key: string, val: string) => {
    const arr = (f as any)[key] as string[];
    set(key, arr.includes(val) ? arr.filter((v: string) => v !== val) : [...arr, val]);
  };

  function calcAge(dob: string): number | null {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB."); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleResumeSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Resume must be under 10MB."); return; }
    setResumeFile(file);
  }

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/30 bg-white";
  const lbl = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";
  const sectionTitle = "text-lg font-semibold text-[#1B3A4B] border-b pb-2 mb-4";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { setError("Name is required."); return; }
    if (!appUser) { setError("You must be logged in."); return; }
    setSaving(true); setError("");

    const age = calcAge(f.dateOfBirth);
    const profileId = crypto.randomUUID();
    let photoUrl = null;
    let resumeUrl = null;

    // Upload photo
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${appUser.id}/${profileId}.${ext}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, photoFile);
      if (upErr) { setError("Photo upload failed: " + upErr.message); setSaving(false); return; }
      photoUrl = path;
    }

    // Upload resume
    if (resumeFile) {
      const ext = resumeFile.name.split(".").pop();
      const path = `${appUser.id}/${profileId}.${ext}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, resumeFile);
      if (upErr) { setError("Resume upload failed: " + upErr.message); setSaving(false); return; }
      resumeUrl = path;
    }

    const { error: err } = await supabase.from("profiles").insert({
      id: profileId, created_by: appUser.id, name: f.name.trim(), gender: f.gender,
      age, date_of_birth: f.dateOfBirth || null, height: f.height,
      hair_color: f.hairColor, eye_color: f.eyeColor, skin_tone: f.skinTone,
      build: f.build, hashkafa: f.hashkafa, city: f.city, state: f.state,
      occupation: f.occupation, learning_status: f.learningStatus, smoking: f.smoking,
      num_siblings: f.numSiblings ? parseInt(f.numSiblings) : null,
      position_in_family: f.positionInFamily, where_to_live: f.whereToLive,
      shul: f.shul, rav: f.rav, camp: f.camp, languages: f.languages.join(", "),
      personality_traits: f.personalityTraits,
      looking_for_description: f.lookingForDescription,
      ready_to_date: f.readyToDate, date_available: f.dateAvailable || null,
      profile_visibility: f.profileVisibility,
      about: f.about, family_info: f.familyInfo, references: f.references, resume: f.resume,
      personal_phone: f.personalPhone, mother_name: f.motherName, mother_phone: f.motherPhone,
      father_name: f.fatherName, father_phone: f.fatherPhone, notes: f.notes,
      schools: f.schools, photo_url: photoUrl, resume_url: resumeUrl,
      preferences: {
        ageMin: f.prefAgeMin, ageMax: f.prefAgeMax, heightMin: f.prefHeightMin,
        heightMax: f.prefHeightMax, hashkafa: f.prefHashkafa, hairColor: f.prefHair,
        build: f.prefBuild, learningStatus: f.prefLearning, smoking: f.prefSmoking,
        notes: f.prefNotes,
      },
    });
    if (err) { setError(err.message); setSaving(false); return; }
    await supabase.from("audit_log").insert({ user_id: appUser.id, action: "created_profile", details: { name: f.name.trim() } });
    router.push("/profiles");
  }

  const schoolList = f.gender === "Girl" ? SCHOOLS_GIRL : SCHOOLS_BOY;

  function ChipSelect({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (val: string) => void }) {
    return (
      <div className="mb-3">
        <label className={lbl}>{label}</label>
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => onToggle(opt)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${active ? "bg-[#1B3A4B] text-white border-[#1B3A4B]" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Add New Profile</h1>
      <div className="bg-white rounded-xl p-6 border border-gray-200 max-w-4xl">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Photo & Resume Upload ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Photo & Resume</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={lbl}>Profile Photo</label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-[#C4956A]" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">No photo</div>
                  )}
                  <div>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="text-sm" />
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 5MB.</p>
                  </div>
                </div>
              </div>
              <div>
                <label className={lbl}>Shidduch Resume (PDF or Word)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="text-sm" />
                  {resumeFile && <p className="text-sm text-green-600 mt-2">✓ {resumeFile.name}</p>}
                  <p className="text-xs text-gray-400 mt-1">PDF or Word doc. Max 10MB.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Personal Info ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Full Name *</label><input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div><label className={lbl}>Gender *</label><select className={inp} value={f.gender} onChange={(e) => set("gender", e.target.value)}><option value="Girl">Girl</option><option value="Boy">Boy</option></select></div>
              <div><label className={lbl}>Date of Birth</label><input className={inp} type="date" value={f.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />{f.dateOfBirth && <span className="text-xs text-gray-400 mt-1 block">Age: {calcAge(f.dateOfBirth)}</span>}</div>
              <div><label className={lbl}>Height</label><select className={inp} value={f.height} onChange={(e) => set("height", e.target.value)}><option value="">Select...</option>{HEIGHTS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Hair Color</label><select className={inp} value={f.hairColor} onChange={(e) => set("hairColor", e.target.value)}><option value="">Select...</option>{HAIR_COLORS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Eye Color</label><select className={inp} value={f.eyeColor} onChange={(e) => set("eyeColor", e.target.value)}><option value="">Select...</option>{EYE_COLORS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Skin Tone</label><select className={inp} value={f.skinTone} onChange={(e) => set("skinTone", e.target.value)}><option value="">Select...</option>{SKIN_TONES.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Build</label><select className={inp} value={f.build} onChange={(e) => set("build", e.target.value)}><option value="">Select...</option>{BUILDS.map((h) => <option key={h}>{h}</option>)}</select></div>
            </div>
          </div>

          {/* ── Religious & Lifestyle ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Religious & Lifestyle</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Hashkafa</label><select className={inp} value={f.hashkafa} onChange={(e) => set("hashkafa", e.target.value)}><option value="">Select...</option>{HASHKAFOS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Learning / Working Status</label><select className={inp} value={f.learningStatus} onChange={(e) => set("learningStatus", e.target.value)}><option value="">Select...</option>{LEARNING_STATUSES.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Shul</label><input className={inp} value={f.shul} onChange={(e) => set("shul", e.target.value)} /></div>
              <div><label className={lbl}>Rav / Rabbi</label><input className={inp} value={f.rav} onChange={(e) => set("rav", e.target.value)} /></div>
              <div><label className={lbl}>Smoking</label><select className={inp} value={f.smoking} onChange={(e) => set("smoking", e.target.value)}><option value="">Select...</option>{SMOKING_OPTIONS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Camp Attended</label><input className={inp} value={f.camp} onChange={(e) => set("camp", e.target.value)} /></div>
            </div>
            <div className="mt-4">
              <ChipSelect label="Languages Spoken" options={LANGUAGES} selected={f.languages} onToggle={(v) => toggleArr("languages", v)} />
            </div>
          </div>

          {/* ── Family ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Family</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Number of Siblings</label><input className={inp} type="number" min="0" max="20" value={f.numSiblings} onChange={(e) => set("numSiblings", e.target.value)} /></div>
              <div><label className={lbl}>Position in Family</label><select className={inp} value={f.positionInFamily} onChange={(e) => set("positionInFamily", e.target.value)}><option value="">Select...</option>{POSITION_OPTIONS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Father Name</label><input className={inp} value={f.fatherName} onChange={(e) => set("fatherName", e.target.value)} /></div>
              <div><label className={lbl}>Father Phone</label><input className={inp} value={f.fatherPhone} onChange={(e) => set("fatherPhone", e.target.value)} /></div>
              <div><label className={lbl}>Mother Name</label><input className={inp} value={f.motherName} onChange={(e) => set("motherName", e.target.value)} /></div>
              <div><label className={lbl}>Mother Phone</label><input className={inp} value={f.motherPhone} onChange={(e) => set("motherPhone", e.target.value)} /></div>
              <div><label className={lbl}>Personal Phone</label><input className={inp} value={f.personalPhone} onChange={(e) => set("personalPhone", e.target.value)} /></div>
            </div>
            <div className="mt-3"><label className={lbl}>Family Background</label><textarea className={inp + " min-h-[60px]"} value={f.familyInfo} onChange={(e) => set("familyInfo", e.target.value)} placeholder="Parents, siblings, family background..." /></div>
          </div>

          {/* ── Location & Plans ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Location & Future Plans</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>City</label><input className={inp} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
              <div><label className={lbl}>State</label><input className={inp} value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
              <div><label className={lbl}>Where Looking to Live</label><input className={inp} value={f.whereToLive} onChange={(e) => set("whereToLive", e.target.value)} placeholder="After marriage..." /></div>
              <div><label className={lbl}>Occupation</label><input className={inp} value={f.occupation} onChange={(e) => set("occupation", e.target.value)} /></div>
              <div><label className={lbl}>Ready to Date</label><select className={inp} value={f.readyToDate} onChange={(e) => set("readyToDate", e.target.value)}>{READY_OPTIONS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Available From</label><input className={inp} type="date" value={f.dateAvailable} onChange={(e) => set("dateAvailable", e.target.value)} /></div>
            </div>
          </div>

          {/* ── Education ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Education</h3>
            <div className="grid grid-cols-2 gap-4">
              {schoolList.map((s) => (
                <div key={s.key}><label className={lbl}>{s.label}</label><input className={inp} value={f.schools[s.key] || ""} onChange={(e) => set("schools", { ...f.schools, [s.key]: e.target.value })} /></div>
              ))}
            </div>
          </div>

          {/* ── Personality & Description ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Personality & Description</h3>
            <ChipSelect label="Personality Traits" options={PERSONALITY_TRAITS} selected={f.personalityTraits} onToggle={(v) => toggleArr("personalityTraits", v)} />
            <div className="mt-3"><label className={lbl}>About / Description</label><textarea className={inp + " min-h-[80px]"} value={f.about} onChange={(e) => set("about", e.target.value)} placeholder="Describe this person — personality, middos, what makes them special..." /></div>
            <div className="mt-3"><label className={lbl}>What They Are Looking For</label><textarea className={inp + " min-h-[80px]"} value={f.lookingForDescription} onChange={(e) => set("lookingForDescription", e.target.value)} placeholder="In their own words, what kind of person are they looking for..." /></div>
          </div>

          {/* ── References ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>References</h3>
            <div><label className={lbl}>References</label><textarea className={inp + " min-h-[60px]"} value={f.references} onChange={(e) => set("references", e.target.value)} placeholder="Names and contact info of references..." /></div>
          </div>

          {/* ── Shadchan Controls ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Shadchan Controls</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className={lbl}>Profile Visibility</label>
                <select className={inp} value={f.profileVisibility} onChange={(e) => set("profileVisibility", e.target.value)}>
                  <option value="private">Private — only you can see</option>
                  <option value="shared">Shared — visible to shadchanim you choose</option>
                  <option value="organization">Organization — all shadchanim can see</option>
                </select>
              </div>
            </div>
            <div><label className={lbl}>Private Shadchan Notes</label><textarea className={inp + " min-h-[60px]"} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Your private notes — only you can see these..." /></div>
          </div>

          {/* ── Match Preferences ── */}
          <div>
            <h3 className={sectionTitle} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Match Preferences</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className={lbl}>Age Min</label><input className={inp} type="number" value={f.prefAgeMin} onChange={(e) => set("prefAgeMin", e.target.value)} /></div>
              <div><label className={lbl}>Age Max</label><input className={inp} type="number" value={f.prefAgeMax} onChange={(e) => set("prefAgeMax", e.target.value)} /></div>
              <div><label className={lbl}>Height Min</label><select className={inp} value={f.prefHeightMin} onChange={(e) => set("prefHeightMin", e.target.value)}><option value="">Any</option>{HEIGHTS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Height Max</label><select className={inp} value={f.prefHeightMax} onChange={(e) => set("prefHeightMax", e.target.value)}><option value="">Any</option>{HEIGHTS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Smoking Preference</label><select className={inp} value={f.prefSmoking} onChange={(e) => set("prefSmoking", e.target.value)}><option value="">No Preference</option><option value="No">Non-smoker only</option><option value="Yes">Open to smoker</option></select></div>
            </div>
            <ChipSelect label="Preferred Hashkafa" options={HASHKAFOS} selected={f.prefHashkafa} onToggle={(v) => toggleArr("prefHashkafa", v)} />
            <ChipSelect label="Preferred Hair Color" options={HAIR_COLORS} selected={f.prefHair} onToggle={(v) => toggleArr("prefHair", v)} />
            <ChipSelect label="Preferred Build" options={BUILDS} selected={f.prefBuild} onToggle={(v) => toggleArr("prefBuild", v)} />
            <ChipSelect label="Preferred Learning Status" options={LEARNING_STATUSES} selected={f.prefLearning} onToggle={(v) => toggleArr("prefLearning", v)} />
            <div className="mt-3"><label className={lbl}>Additional Preference Notes</label><textarea className={inp + " min-h-[50px]"} value={f.prefNotes} onChange={(e) => set("prefNotes", e.target.value)} /></div>
          </div>

          {/* ── Submit ── */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm bg-[#1B3A4B] text-white rounded-lg hover:bg-[#244E63] disabled:opacity-50">{saving ? "Saving..." : "Create Profile"}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
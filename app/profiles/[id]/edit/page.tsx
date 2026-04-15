"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import {
  HAIR_COLORS, SKIN_TONES, EYE_COLORS, HASHKAFOS, BUILDS, HEIGHTS,
  SCHOOLS_GIRL, SCHOOLS_BOY, LEARNING_STATUSES, SMOKING_OPTIONS,
  POSITION_OPTIONS, READY_OPTIONS, PERSONALITY_TRAITS, LANGUAGES,
} from "@/types";

export default function EditProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { appUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");
  const [existingResumeUrl, setExistingResumeUrl] = useState("");
  const [existingResumePath, setExistingResumePath] = useState("");
  const [existingPhotoPath, setExistingPhotoPath] = useState("");
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState("");
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
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

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", id).single();
      if (p) {
        setF({
          name: p.name || "", gender: p.gender || "Girl",
          dateOfBirth: p.date_of_birth || "",
          height: p.height || "", hairColor: p.hair_color || "", eyeColor: p.eye_color || "",
          skinTone: p.skin_tone || "", build: p.build || "", hashkafa: p.hashkafa || "",
          city: p.city || "", state: p.state || "", occupation: p.occupation || "",
          learningStatus: p.learning_status || "", smoking: p.smoking || "",
          numSiblings: p.num_siblings?.toString() || "", positionInFamily: p.position_in_family || "",
          whereToLive: p.where_to_live || "", shul: p.shul || "", rav: p.rav || "",
          camp: p.camp || "", languages: p.languages ? p.languages.split(", ").filter(Boolean) : [],
          personalityTraits: p.personality_traits || [],
          lookingForDescription: p.looking_for_description || "",
          readyToDate: p.ready_to_date || "Yes", dateAvailable: p.date_available || "",
          profileVisibility: p.profile_visibility || "private",
          about: p.about || "", familyInfo: p.family_info || "", references: p.references || "",
          resume: p.resume || "", personalPhone: p.personal_phone || "",
          motherName: p.mother_name || "", motherPhone: p.mother_phone || "",
          fatherName: p.father_name || "", fatherPhone: p.father_phone || "",
          notes: p.notes || "", schools: p.schools || {},
          prefAgeMin: p.preferences?.ageMin || "", prefAgeMax: p.preferences?.ageMax || "",
          prefHeightMin: p.preferences?.heightMin || "", prefHeightMax: p.preferences?.heightMax || "",
          prefHashkafa: p.preferences?.hashkafa || [], prefHair: p.preferences?.hairColor || [],
          prefBuild: p.preferences?.build || [], prefLearning: p.preferences?.learningStatus || [],
          prefSmoking: p.preferences?.smoking || "", prefNotes: p.preferences?.notes || "",
        });
        // Load existing photo
        if (p.photo_url) {
          setExistingPhotoPath(p.photo_url);
          const { data: photoData } = await supabase.storage.from("photos").createSignedUrl(p.photo_url, 3600);
          if (photoData?.signedUrl) setExistingPhotoUrl(photoData.signedUrl);
        }
        // Load existing resume
        if (p.resume_url) {
          setExistingResumePath(p.resume_url);
          const { data: resumeData } = await supabase.storage.from("resumes").createSignedUrl(p.resume_url, 3600);
          if (resumeData?.signedUrl) setExistingResumeUrl(resumeData.signedUrl);
        }
      }
      setLoaded(true);
    }
    load();
  }, [id]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB."); return; }
    setNewPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setNewPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleResumeSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Resume must be under 10MB."); return; }
    setNewResumeFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    const age = calcAge(f.dateOfBirth);

    let photoUrl = existingPhotoPath;
    let resumeUrl = existingResumePath;

    // Upload new photo if selected
    if (newPhotoFile) {
      // Delete old photo if exists
      if (existingPhotoPath) await supabase.storage.from("photos").remove([existingPhotoPath]);
      const ext = newPhotoFile.name.split(".").pop();
      const path = `${appUser!.id}/${id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("photos").upload(path, newPhotoFile, { upsert: true });
      if (upErr) { setError("Photo upload failed: " + upErr.message); setSaving(false); return; }
      photoUrl = path;
    }

    // Upload new resume if selected
    if (newResumeFile) {
      if (existingResumePath) await supabase.storage.from("resumes").remove([existingResumePath]);
      const ext = newResumeFile.name.split(".").pop();
      const path = `${appUser!.id}/${id}-resume.${ext}`;
      const { error: upErr } = await supabase.storage.from("resumes").upload(path, newResumeFile, { upsert: true });
      if (upErr) { setError("Resume upload failed: " + upErr.message); setSaving(false); return; }
      resumeUrl = path;
    }

    const { error: err } = await supabase.from("profiles").update({
      name: f.name.trim(), gender: f.gender, age,
      date_of_birth: f.dateOfBirth || null, height: f.height,
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
      father_name: f.fatherName, father_phone: f.fatherPhone, notes: f.notes, schools: f.schools,
      photo_url: photoUrl || null, resume_url: resumeUrl || null,
      preferences: {
        ageMin: f.prefAgeMin, ageMax: f.prefAgeMax, heightMin: f.prefHeightMin,
        heightMax: f.prefHeightMax, hashkafa: f.prefHashkafa, hairColor: f.prefHair,
        build: f.prefBuild, learningStatus: f.prefLearning, smoking: f.prefSmoking,
        notes: f.prefNotes,
      },
    }).eq("id", id);
    if (err) { setError(err.message); setSaving(false); return; }
    await supabase.from("audit_log").insert({ user_id: appUser!.id, action: "updated_profile", details: { name: f.name.trim() } });
    router.push(`/profiles/${id}`);
  }

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]/30 bg-white";
  const lbl = "block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1";
  const secHead = "text-lg font-semibold text-[#1B3A4B] border-b pb-2 mb-4";
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

  if (!loaded) return <AppShell><p className="text-gray-400">Loading...</p></AppShell>;

  return (
    <AppShell>
      <button onClick={() => router.back()} className="text-sm text-[#6B8E9B] hover:underline mb-4 block">← Back</button>
      <h1 className="text-3xl font-bold text-[#1B3A4B] mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Edit Profile</h1>
      <div className="bg-white rounded-xl p-6 border border-gray-200 max-w-4xl">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Photo & Resume */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Photo & Resume</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={lbl}>Profile Photo</label>
                <div className="flex items-center gap-4">
                  {(newPhotoPreview || existingPhotoUrl) ? (
                    <img src={newPhotoPreview || existingPhotoUrl} alt="Photo" className="w-20 h-20 rounded-full object-cover border-2 border-[#C4956A]" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">No photo</div>
                  )}
                  <div>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="text-sm" />
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 5MB.</p>
                    {existingPhotoUrl && !newPhotoFile && <p className="text-xs text-green-600 mt-0.5">✓ Photo on file</p>}
                    {newPhotoFile && <p className="text-xs text-blue-600 mt-0.5">New photo selected — will replace current</p>}
                  </div>
                </div>
              </div>
              <div>
                <label className={lbl}>Shidduch Resume (their PDF/Word)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">This is the resume the boy/girl created themselves. You can download it and send to families.</p>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="text-sm" />
                  {newResumeFile && <p className="text-sm text-blue-600 mt-2">New file: {newResumeFile.name}</p>}
                  {existingResumeUrl && !newResumeFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-green-600">✓ Resume on file</span>
                      <a href={existingResumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C4956A] hover:underline">Download current →</a>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">PDF or Word. Max 10MB.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Full Name *</label><input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div><label className={lbl}>Gender</label><select className={inp} value={f.gender} onChange={(e) => set("gender", e.target.value)}><option value="Girl">Girl</option><option value="Boy">Boy</option></select></div>
              <div><label className={lbl}>Date of Birth</label><input className={inp} type="date" value={f.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />{f.dateOfBirth && <span className="text-xs text-gray-400 mt-1 block">Age: {calcAge(f.dateOfBirth)}</span>}</div>
              <div><label className={lbl}>Height</label><select className={inp} value={f.height} onChange={(e) => set("height", e.target.value)}><option value="">Select...</option>{HEIGHTS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Hair Color</label><select className={inp} value={f.hairColor} onChange={(e) => set("hairColor", e.target.value)}><option value="">Select...</option>{HAIR_COLORS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Eye Color</label><select className={inp} value={f.eyeColor} onChange={(e) => set("eyeColor", e.target.value)}><option value="">Select...</option>{EYE_COLORS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Skin Tone</label><select className={inp} value={f.skinTone} onChange={(e) => set("skinTone", e.target.value)}><option value="">Select...</option>{SKIN_TONES.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Build</label><select className={inp} value={f.build} onChange={(e) => set("build", e.target.value)}><option value="">Select...</option>{BUILDS.map((h) => <option key={h}>{h}</option>)}</select></div>
            </div>
          </div>

          {/* Religious */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Religious & Lifestyle</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Hashkafa</label><select className={inp} value={f.hashkafa} onChange={(e) => set("hashkafa", e.target.value)}><option value="">Select...</option>{HASHKAFOS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Learning / Working</label><select className={inp} value={f.learningStatus} onChange={(e) => set("learningStatus", e.target.value)}><option value="">Select...</option>{LEARNING_STATUSES.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Shul</label><input className={inp} value={f.shul} onChange={(e) => set("shul", e.target.value)} /></div>
              <div><label className={lbl}>Rav / Rabbi</label><input className={inp} value={f.rav} onChange={(e) => set("rav", e.target.value)} /></div>
              <div><label className={lbl}>Smoking</label><select className={inp} value={f.smoking} onChange={(e) => set("smoking", e.target.value)}><option value="">Select...</option>{SMOKING_OPTIONS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Camp</label><input className={inp} value={f.camp} onChange={(e) => set("camp", e.target.value)} /></div>
            </div>
            <div className="mt-4"><ChipSelect label="Languages" options={LANGUAGES} selected={f.languages} onToggle={(v) => toggleArr("languages", v)} /></div>
          </div>

          {/* Family */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Family</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Siblings</label><input className={inp} type="number" min="0" value={f.numSiblings} onChange={(e) => set("numSiblings", e.target.value)} /></div>
              <div><label className={lbl}>Position</label><select className={inp} value={f.positionInFamily} onChange={(e) => set("positionInFamily", e.target.value)}><option value="">Select...</option>{POSITION_OPTIONS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Father Name</label><input className={inp} value={f.fatherName} onChange={(e) => set("fatherName", e.target.value)} /></div>
              <div><label className={lbl}>Father Phone</label><input className={inp} value={f.fatherPhone} onChange={(e) => set("fatherPhone", e.target.value)} /></div>
              <div><label className={lbl}>Mother Name</label><input className={inp} value={f.motherName} onChange={(e) => set("motherName", e.target.value)} /></div>
              <div><label className={lbl}>Mother Phone</label><input className={inp} value={f.motherPhone} onChange={(e) => set("motherPhone", e.target.value)} /></div>
              <div><label className={lbl}>Personal Phone</label><input className={inp} value={f.personalPhone} onChange={(e) => set("personalPhone", e.target.value)} /></div>
            </div>
            <div className="mt-3"><label className={lbl}>Family Background</label><textarea className={inp + " min-h-[60px]"} value={f.familyInfo} onChange={(e) => set("familyInfo", e.target.value)} /></div>
          </div>

          {/* Location */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Location & Plans</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>City</label><input className={inp} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
              <div><label className={lbl}>State</label><input className={inp} value={f.state} onChange={(e) => set("state", e.target.value)} /></div>
              <div><label className={lbl}>Where to Live</label><input className={inp} value={f.whereToLive} onChange={(e) => set("whereToLive", e.target.value)} /></div>
              <div><label className={lbl}>Occupation</label><input className={inp} value={f.occupation} onChange={(e) => set("occupation", e.target.value)} /></div>
              <div><label className={lbl}>Ready to Date</label><select className={inp} value={f.readyToDate} onChange={(e) => set("readyToDate", e.target.value)}>{READY_OPTIONS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Available From</label><input className={inp} type="date" value={f.dateAvailable} onChange={(e) => set("dateAvailable", e.target.value)} /></div>
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Education</h3>
            <div className="grid grid-cols-2 gap-4">{schoolList.map((s) => (<div key={s.key}><label className={lbl}>{s.label}</label><input className={inp} value={f.schools[s.key] || ""} onChange={(e) => set("schools", { ...f.schools, [s.key]: e.target.value })} /></div>))}</div>
          </div>

          {/* Personality */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Personality</h3>
            <ChipSelect label="Traits" options={PERSONALITY_TRAITS} selected={f.personalityTraits} onToggle={(v) => toggleArr("personalityTraits", v)} />
            <div className="mt-3"><label className={lbl}>About</label><textarea className={inp + " min-h-[80px]"} value={f.about} onChange={(e) => set("about", e.target.value)} /></div>
            <div className="mt-3"><label className={lbl}>Looking For</label><textarea className={inp + " min-h-[80px]"} value={f.lookingForDescription} onChange={(e) => set("lookingForDescription", e.target.value)} /></div>
          </div>

          {/* References */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>References</h3>
            <div><label className={lbl}>References</label><textarea className={inp + " min-h-[60px]"} value={f.references} onChange={(e) => set("references", e.target.value)} /></div>
          </div>

          {/* Shadchan Controls */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Shadchan Controls</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div><label className={lbl}>Visibility</label><select className={inp} value={f.profileVisibility} onChange={(e) => set("profileVisibility", e.target.value)}><option value="private">Private — only you</option><option value="shared">Shared — chosen shadchanim</option><option value="organization">Organization — all</option></select></div>
            </div>
            <div><label className={lbl}>Private Notes</label><textarea className={inp + " min-h-[60px]"} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className={secHead} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Match Preferences</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className={lbl}>Age Min</label><input className={inp} type="number" value={f.prefAgeMin} onChange={(e) => set("prefAgeMin", e.target.value)} /></div>
              <div><label className={lbl}>Age Max</label><input className={inp} type="number" value={f.prefAgeMax} onChange={(e) => set("prefAgeMax", e.target.value)} /></div>
              <div><label className={lbl}>Height Min</label><select className={inp} value={f.prefHeightMin} onChange={(e) => set("prefHeightMin", e.target.value)}><option value="">Any</option>{HEIGHTS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Height Max</label><select className={inp} value={f.prefHeightMax} onChange={(e) => set("prefHeightMax", e.target.value)}><option value="">Any</option>{HEIGHTS.map((h) => <option key={h}>{h}</option>)}</select></div>
              <div><label className={lbl}>Smoking</label><select className={inp} value={f.prefSmoking} onChange={(e) => set("prefSmoking", e.target.value)}><option value="">No Preference</option><option value="No">Non-smoker only</option><option value="Yes">Open</option></select></div>
            </div>
            <ChipSelect label="Hashkafa" options={HASHKAFOS} selected={f.prefHashkafa} onToggle={(v) => toggleArr("prefHashkafa", v)} />
            <ChipSelect label="Hair Color" options={HAIR_COLORS} selected={f.prefHair} onToggle={(v) => toggleArr("prefHair", v)} />
            <ChipSelect label="Build" options={BUILDS} selected={f.prefBuild} onToggle={(v) => toggleArr("prefBuild", v)} />
            <ChipSelect label="Learning Status" options={LEARNING_STATUSES} selected={f.prefLearning} onToggle={(v) => toggleArr("prefLearning", v)} />
            <div className="mt-3"><label className={lbl}>Preference Notes</label><textarea className={inp + " min-h-[50px]"} value={f.prefNotes} onChange={(e) => set("prefNotes", e.target.value)} /></div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm bg-[#1B3A4B] text-white rounded-lg hover:bg-[#244E63] disabled:opacity-50">{saving ? "Saving..." : "Update Profile"}</button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
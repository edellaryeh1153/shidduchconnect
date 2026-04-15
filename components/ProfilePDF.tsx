"use client";

export function generateProfilePDF(profile: any, photoUrl?: string) {
  const isGirl = profile.gender === "Girl";
  const color = isGirl ? "#C4956A" : "#1B3A4B";
  
  const schools = profile.schools || {};
  const prefs = profile.preferences || {};

  const escHtml = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${escHtml(profile.name)} - Shidduch Resume</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Crimson Pro', Georgia, serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; color: ${color}; margin-bottom: 4px; }
  h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; color: ${color}; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 20px 0 10px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${color}; padding-bottom: 16px; margin-bottom: 20px; }
  .header-left { flex: 1; }
  .subtitle { font-size: 14px; color: #888; }
  .logo { width: 50px; height: 50px; background: ${color}; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: bold; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .field-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.8px; }
  .field-value { font-size: 13px; font-weight: 500; margin-bottom: 6px; }
  .section-text { font-size: 13px; line-height: 1.6; color: #555; margin-bottom: 8px; }
  .traits { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
  .trait { padding: 2px 10px; border-radius: 12px; font-size: 11px; background: #f0f0f0; color: #555; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #bbb; }
  .photo { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 2px solid ${color}; margin-left: 20px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${escHtml(profile.name)}</h1>
      <div class="subtitle">${escHtml(profile.gender)} · ${profile.age || "?"} years old · ${escHtml(profile.hashkafa || "")}</div>
      <div class="subtitle">${escHtml([profile.city, profile.state].filter(Boolean).join(", "))}</div>
    </div>
    ${photoUrl ? `<img src="${photoUrl}" class="photo" />` : `<div class="logo">שׁ</div>`}
  </div>

  <h2>Personal Information</h2>
  <div class="grid">
    ${[
      ["Age", profile.age],
      ["Height", profile.height],
      ["Hair", profile.hair_color],
      ["Eyes", profile.eye_color],
      ["Skin Tone", profile.skin_tone],
      ["Build", profile.build],
      ["Hashkafa", profile.hashkafa],
      ["Learning Status", profile.learning_status],
      ["Occupation", profile.occupation],
      ["Smoking", profile.smoking],
      ["Location", [profile.city, profile.state].filter(Boolean).join(", ")],
      ["Where to Live", profile.where_to_live],
    ].filter(([,v]) => v).map(([k,v]) => `
      <div><div class="field-label">${k}</div><div class="field-value">${escHtml(String(v))}</div></div>
    `).join("")}
  </div>

  ${profile.shul || profile.rav || profile.camp ? `
  <h2>Religious Life</h2>
  <div class="grid">
    ${profile.shul ? `<div><div class="field-label">Shul</div><div class="field-value">${escHtml(profile.shul)}</div></div>` : ""}
    ${profile.rav ? `<div><div class="field-label">Rav / Rabbi</div><div class="field-value">${escHtml(profile.rav)}</div></div>` : ""}
    ${profile.camp ? `<div><div class="field-label">Camp</div><div class="field-value">${escHtml(profile.camp)}</div></div>` : ""}
    ${profile.languages ? `<div><div class="field-label">Languages</div><div class="field-value">${escHtml(profile.languages)}</div></div>` : ""}
  </div>` : ""}

  <h2>Family</h2>
  <div class="grid">
    ${profile.father_name ? `<div><div class="field-label">Father</div><div class="field-value">${escHtml(profile.father_name)}${profile.father_phone ? ` — ${escHtml(profile.father_phone)}` : ""}</div></div>` : ""}
    ${profile.mother_name ? `<div><div class="field-label">Mother</div><div class="field-value">${escHtml(profile.mother_name)}${profile.mother_phone ? ` — ${escHtml(profile.mother_phone)}` : ""}</div></div>` : ""}
    ${profile.num_siblings != null ? `<div><div class="field-label">Siblings</div><div class="field-value">${profile.num_siblings}${profile.position_in_family ? ` (${escHtml(profile.position_in_family)})` : ""}</div></div>` : ""}
    ${profile.personal_phone ? `<div><div class="field-label">Personal Phone</div><div class="field-value">${escHtml(profile.personal_phone)}</div></div>` : ""}
  </div>
  ${profile.family_info ? `<div class="section-text" style="margin-top:8px">${escHtml(profile.family_info)}</div>` : ""}

  <h2>Education</h2>
  <div class="grid">
    ${Object.entries(schools).filter(([,v]) => v).map(([k,v]) => {
      const labels: Record<string,string> = { elementary: "Elementary", highSchool: "High School", seminary: "Seminary", yeshiva: "Yeshiva", college: "College" };
      return `<div><div class="field-label">${labels[k] || k}</div><div class="field-value">${escHtml(String(v))}</div></div>`;
    }).join("")}
  </div>

  ${profile.personality_traits?.length > 0 ? `
  <h2>Personality</h2>
  <div class="traits">${profile.personality_traits.map((t: string) => `<span class="trait">${escHtml(t)}</span>`).join("")}</div>` : ""}

  ${profile.about ? `<h2>About</h2><div class="section-text">${escHtml(profile.about)}</div>` : ""}

  ${profile.looking_for_description ? `<h2>Looking For</h2><div class="section-text">${escHtml(profile.looking_for_description)}</div>` : ""}

  ${prefs.ageMin || prefs.hashkafa?.length || prefs.build?.length ? `
  <h2>Match Preferences</h2>
  <div class="grid">
    ${prefs.ageMin ? `<div><div class="field-label">Age Range</div><div class="field-value">${prefs.ageMin}–${prefs.ageMax}</div></div>` : ""}
    ${prefs.heightMin ? `<div><div class="field-label">Height Range</div><div class="field-value">${prefs.heightMin}–${prefs.heightMax}</div></div>` : ""}
    ${prefs.hashkafa?.length ? `<div><div class="field-label">Hashkafa</div><div class="field-value">${prefs.hashkafa.join(", ")}</div></div>` : ""}
    ${prefs.build?.length ? `<div><div class="field-label">Build</div><div class="field-value">${prefs.build.join(", ")}</div></div>` : ""}
    ${prefs.learningStatus?.length ? `<div><div class="field-label">Learning Status</div><div class="field-value">${prefs.learningStatus.join(", ")}</div></div>` : ""}
    ${prefs.smoking ? `<div><div class="field-label">Smoking</div><div class="field-value">${prefs.smoking === "No" ? "Non-smoker only" : "Open"}</div></div>` : ""}
  </div>
  ${prefs.notes ? `<div class="section-text" style="margin-top:8px">${escHtml(prefs.notes)}</div>` : ""}` : ""}

  ${profile.references ? `<h2>References</h2><div class="section-text">${escHtml(profile.references)}</div>` : ""}

  <div class="footer">Generated by ShidduchConnect · ${new Date().toLocaleDateString()} · Confidential</div>
</body>
</html>`;

  // Open in new window for printing/saving as PDF
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    // Auto-trigger print dialog after a moment for images to load
    setTimeout(() => win.print(), 500);
  }
}
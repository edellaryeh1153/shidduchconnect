"use client";

export function generateMatchReport(match: any, notes: any[], dates: any[]) {
  const bp = match.boy_profile;
  const gp = match.girl_profile;
  const escHtml = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Match Report — ${escHtml(bp?.name)} & ${escHtml(gp?.name)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Crimson Pro', Georgia, serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 13px; }
  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; color: #1B3A4B; }
  h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; color: #1B3A4B; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 18px 0 8px; }
  .header { border-bottom: 2px solid #1B3A4B; padding-bottom: 12px; margin-bottom: 16px; }
  .status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 12px; color: white; background: #6B8E9B; }
  .profiles { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .profile-card { padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
  .profile-card h3 { font-size: 15px; margin-bottom: 6px; }
  .boy { border-left: 3px solid #1B3A4B; }
  .girl { border-left: 3px solid #C4956A; }
  .field { margin-bottom: 3px; }
  .field-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
  .note { padding: 8px; margin-bottom: 6px; border-left: 3px solid #C4956A; background: #fafafa; border-radius: 4px; }
  .note-date { font-size: 10px; color: #999; }
  .note-author { font-size: 10px; color: #999; float: right; }
  .note-private { border-left-color: #D4A853; background: #FFF8E7; }
  .note-status { border-left-color: #6B8E9B; }
  .date-card { padding: 8px; margin-bottom: 6px; border: 1px solid #eee; border-radius: 6px; }
  .feedback-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
  .feedback-box { padding: 6px; border-radius: 4px; font-size: 11px; }
  .boy-feedback { background: #EBF4FF; }
  .girl-feedback { background: #FFF0F5; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #bbb; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${escHtml(bp?.name)} & ${escHtml(gp?.name)}</h1>
    <div style="margin-top:6px;">
      <span class="status">${escHtml(match.status)}</span>
      <span style="font-size:12px;color:#999;margin-left:8px;">Started ${new Date(match.created_at).toLocaleDateString()} · Contacted ${match.contacted_first} side first</span>
    </div>
    ${match.boy_response_notes ? `<div style="margin-top:6px;font-size:12px;"><strong>Boy response:</strong> ${escHtml(match.boy_response_notes)}</div>` : ""}
    ${match.girl_response_notes ? `<div style="margin-top:4px;font-size:12px;"><strong>Girl response:</strong> ${escHtml(match.girl_response_notes)}</div>` : ""}
  </div>

  <div class="profiles">
    ${[bp, gp].filter(Boolean).map((p: any) => `
      <div class="profile-card ${p.gender === 'Girl' ? 'girl' : 'boy'}">
        <h3 style="color:${p.gender === 'Girl' ? '#C4956A' : '#1B3A4B'}">${escHtml(p.name)}</h3>
        ${[
          ["Age", p.age], ["Height", p.height], ["Hashkafa", p.hashkafa],
          ["Learning", p.learning_status], ["Location", [p.city, p.state].filter(Boolean).join(", ")],
          ["Occupation", p.occupation],
        ].filter(([,v]) => v).map(([k,v]) => `<div class="field"><span class="field-label">${k}:</span> ${escHtml(String(v))}</div>`).join("")}
        ${p.personality_traits?.length ? `<div class="field"><span class="field-label">Traits:</span> ${p.personality_traits.join(", ")}</div>` : ""}
      </div>
    `).join("")}
  </div>

  ${dates.length > 0 ? `
  <h2>Dates (${dates.length})</h2>
  ${dates.map((d: any) => `
    <div class="date-card">
      <strong>Date #${d.date_number}</strong> — ${new Date(d.date_time).toLocaleDateString()} at ${new Date(d.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      ${d.location ? ` · ${escHtml(d.location)}` : ""} · <em>${d.status}</em>
      ${d.boy_feedback || d.girl_feedback ? `
        <div class="feedback-grid">
          <div class="feedback-box boy-feedback">
            <strong>Boy:</strong> ${d.boy_wants_another || "?"} — ${escHtml(d.boy_feedback || "No feedback")}
          </div>
          <div class="feedback-box girl-feedback">
            <strong>Girl:</strong> ${d.girl_wants_another || "?"} — ${escHtml(d.girl_feedback || "No feedback")}
          </div>
        </div>
        ${d.end_reason ? `<div style="margin-top:4px;font-size:11px;color:#A0736C;"><strong>Reason:</strong> ${escHtml(d.end_reason)}</div>` : ""}
      ` : ""}
    </div>
  `).join("")}` : ""}

  ${notes.length > 0 ? `
  <h2>Notes (${notes.length})</h2>
  ${notes.map((n: any) => `
    <div class="note ${n.is_private ? 'note-private' : ''} ${n.note_type === 'status_change' ? 'note-status' : ''}">
      <span class="note-date">${new Date(n.created_at).toLocaleDateString()}</span>
      <span class="note-author">${escHtml(n.author?.name || "")}</span>
      ${n.is_private ? '<span style="font-size:9px;background:#D4A853;color:white;padding:1px 6px;border-radius:8px;margin-left:4px;">Private</span>' : ""}
      <div style="margin-top:4px;white-space:pre-wrap;">${escHtml(n.note_text)}</div>
    </div>
  `).join("")}` : ""}

  <div class="footer">Generated by ShidduchConnect · ${new Date().toLocaleDateString()} · Confidential</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
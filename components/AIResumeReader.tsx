"use client";
import { useState } from "react";

type Props = {
  onFieldsExtracted: (fields: Record<string, any>) => void;
};

export default function AIResumeReader({ onFieldsExtracted }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleRead() {
    if (!file) return;
    setReading(true);
    setStatus("Reading resume...");

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const mediaType = file.name.endsWith(".pdf") ? "application/pdf" : 
        file.name.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
        "application/pdf";

      setStatus("AI is analyzing the resume...");

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: `You are reading a shidduch resume (Jewish matchmaking profile). Extract all information you can find and return ONLY a JSON object with no other text, no markdown backticks, no explanation. Use exactly these field names:

{
  "name": "full name",
  "gender": "Boy" or "Girl",
  "age": number or null,
  "dateOfBirth": "YYYY-MM-DD" or "",
  "height": "5'7\\"" format or "",
  "hairColor": "Black", "Dark Brown", "Brown", "Light Brown", "Blonde", "Red", "Auburn", or "Gray",
  "eyeColor": "Brown", "Hazel", "Green", "Blue", or "Gray",
  "build": "Slim", "Average", "Athletic", or "Heavy",
  "hashkafa": "Chassidish", "Yeshivish", "Modern Orthodox Machmir", "Modern Orthodox", "Modern Orthodox Liberal", "Sephardi", or "Other",
  "city": "",
  "state": "",
  "occupation": "",
  "learningStatus": "Full-time Learning", "Part-time Learning", "Working", "Learning & Working", "In School", or "Other",
  "shul": "",
  "rav": "",
  "camp": "",
  "schools": { "elementary": "", "highSchool": "", "seminary": "", "yeshiva": "", "college": "" },
  "fatherName": "",
  "motherName": "",
  "numSiblings": number or null,
  "positionInFamily": "Oldest", "Middle", "Youngest", or "Only Child",
  "about": "personality description text",
  "lookingForDescription": "what they are looking for in a match",
  "references": "reference names and contact info",
  "personalityTraits": ["Outgoing", "Warm", etc from: Outgoing, Quiet, Funny, Serious, Creative, Analytical, Ambitious, Laid-back, Warm, Independent, Family-oriented, Intellectual, Adventurous, Organized, Flexible, Caring, Confident, Shy, Energetic, Calm]
}

Fill in whatever you can find. Leave empty string "" for fields not found. Return ONLY the JSON.`
              }
            ]
          }],
        }),
      });

      const data = await resp.json();
      const aiText = data.content?.map((c: any) => c.text || "").join("") || "";
      
      // Clean and parse JSON
      const cleaned = aiText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setStatus("Fields extracted! Review and adjust below.");
      onFieldsExtracted(parsed);
    } catch (err: any) {
      setStatus("Error reading resume: " + (err.message || "Unknown error. Try a different file format."));
    }
    setReading(false);
  }

  return (
    <div className="p-4 bg-gradient-to-r from-[#1B3A4B]/5 to-[#C4956A]/5 border border-[#C4956A]/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✧</span>
        <h3 className="text-sm font-semibold text-[#1B3A4B]">AI Resume Reader</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">Upload a shidduch resume and AI will automatically fill in the profile fields.</p>
      
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm flex-1"
        />
        <button
          onClick={handleRead}
          disabled={!file || reading}
          className="px-4 py-2 bg-[#C4956A] text-white rounded-lg text-sm font-medium hover:bg-[#B08459] disabled:opacity-50 transition-colors shrink-0"
        >
          {reading ? "Reading..." : "✧ AI Read Resume"}
        </button>
      </div>

      {status && (
        <div className={`mt-2 text-sm ${status.includes("Error") ? "text-red-600" : status.includes("extracted") ? "text-green-600" : "text-[#C4956A]"}`}>
          {reading && <span className="inline-block animate-pulse mr-1">●</span>}
          {status}
        </div>
      )}
    </div>
  );
}
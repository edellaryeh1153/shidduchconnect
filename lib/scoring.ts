import type { Profile } from "@/types";
import { HEIGHTS } from "@/types";

export function computeScore(profile: Profile, candidate: Profile): number {
  let score = 0, maxScore = 0;
  const p = profile.preferences || {};
  if (p.ageMin || p.ageMax) {
    maxScore += 20;
    const age = candidate.age || 0;
    const min = parseInt(p.ageMin || "0") || 0;
    const max = parseInt(p.ageMax || "99") || 99;
    if (age >= min && age <= max) score += 20;
    else if (Math.abs(age - min) <= 2 || Math.abs(age - max) <= 2) score += 10;
  }
  if (p.hashkafa?.length) { maxScore += 25; if (p.hashkafa.includes(candidate.hashkafa)) score += 25; }
  if (p.hairColor?.length) { maxScore += 10; if (p.hairColor.includes(candidate.hair_color)) score += 10; }
  if (p.build?.length) { maxScore += 10; if (p.build.includes(candidate.build)) score += 10; }
  if (p.heightMin || p.heightMax) {
    maxScore += 15;
    const hi = HEIGHTS.indexOf(candidate.height);
    const mni = p.heightMin ? HEIGHTS.indexOf(p.heightMin) : 0;
    const mai = p.heightMax ? HEIGHTS.indexOf(p.heightMax) : HEIGHTS.length - 1;
    if (hi >= 0 && hi >= mni && hi <= mai) score += 15;
    else if (hi >= 0 && (Math.abs(hi - mni) <= 2 || Math.abs(hi - mai) <= 2)) score += 7;
  }
  if (candidate.city && profile.city) {
    maxScore += 10;
    if (candidate.city.toLowerCase() === profile.city.toLowerCase()) score += 10;
    else if (candidate.state && profile.state && candidate.state.toLowerCase() === profile.state.toLowerCase()) score += 5;
  }
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
}
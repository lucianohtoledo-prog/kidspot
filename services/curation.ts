// Simple heuristic "AI" curation placeholder.
// In production you can replace this with an LLM call.
import type { LocalPlace } from '../types/models';

const KEYWORDS = [
  'brinquedoteca','parquinho','playground','kids','infantil','fraldário','fraldario','troca de fraldas','monitores','family','menu kids','área kids','area kids'
];

export function isKidsFriendly(p: LocalPlace): boolean {
  const hay = (p.description || '' + ' ' + (p.categories||[]).join(' ') + ' ' + (p.amenities||[]).join(' ')).toLowerCase();
  return KEYWORDS.some(k => hay.includes(k));
}

export function scorePlace(p: LocalPlace): number {
  let score = 0;
  if (p.googleRating) score += p.googleRating;
  if ((p.amenities||[]).includes('playroom')) score += 1.0;
  if ((p.amenities||[]).includes('playground')) score += 1.0;
  if ((p.amenities||[]).includes('changing_table')) score += 0.5;
  if ((p.amenities||[]).includes('fenced_area')) score += 0.5;
  if ((p.amenities||[]).includes('kids_menu')) score += 0.3;
  if ((p.amenities||[]).includes('monitors')) score += 0.5;
  if (p.boostedUntil && Date.now() < p.boostedUntil) score += 2.0;
  return score;
}

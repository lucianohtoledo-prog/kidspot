import type { Filters, LocalPlace } from '../types/models';

type AgeFilter = Filters['childrenAge'];

type FeatureChip = {
  id: string;
  label: string;
  keywords: string[];
};

const INCLUSION_KEYWORDS = [
  'kids',
  'kid',
  'child',
  'children',
  'family',
  'playground',
  'brinquedoteca',
  'parquinho',
  'espaço kids',
  'espaco kids',
  'menu infantil',
  'kids-friendly',
  'kids friendly',
  'área kids',
  'area kids',
];

const EXCLUSION_KEYWORDS = ['hotel', 'pousada', 'motel', 'resort', 'hostel'];
const EXCLUSION_TYPES = new Set(['lodging', 'hotel', 'motel', 'hostel']);

const CORE_KID_TYPES = new Set(['playground', 'park', 'amusement_park', 'zoo', 'aquarium', 'museum']);

const SMALL_KIDS_KEYWORDS = [
  'brinquedoteca',
  'fraldário',
  'fraldario',
  'troca de fraldas',
  'cadeirão',
  'cadeirao',
  'menu infantil',
  'menu kids',
  'cantinho baby',
  'primeira infância',
  'primeira infancia',
];

const SMALL_KIDS_TYPES = new Set(['playground', 'park', 'cafe', 'bakery']);

const BIG_KIDS_KEYWORDS = [
  'trampolim',
  'pista',
  'escalada',
  'boliche',
  'arcade',
  'laser tag',
  'parque de diversão',
  'parque de diversao',
  'games',
];

const BIG_KIDS_TYPES = new Set(['amusement_park', 'tourist_attraction', 'recreation_center', 'shopping_mall']);

const FEATURE_CHIPS: FeatureChip[] = [
  { id: 'kids-area', label: 'Espaço kids', keywords: ['espaço kids', 'espaco kids', 'area kids', 'área kids'] },
  { id: 'menu-kids', label: 'Menu infantil', keywords: ['menu infantil', 'menu kids'] },
  { id: 'nursery', label: 'Fraldário', keywords: ['fraldário', 'fraldario', 'troca de fraldas'] },
  { id: 'high-chair', label: 'Cadeirão', keywords: ['cadeirão', 'cadeirao', 'cadeira de bebê', 'cadeira de bebe'] },
  { id: 'fenced', label: 'Área cercada', keywords: ['área cercada', 'area cercada', 'espaço cercado', 'espaco cercado'] },
  { id: 'monitors', label: 'Monitores', keywords: ['monitoria', 'monitores', 'monitor infantil'] },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const aggregateText = (place: LocalPlace) => {
  const parts: string[] = [];
  if (place.name) parts.push(place.name);
  if (place.description) parts.push(place.description);
  if (Array.isArray(place.categories)) parts.push(place.categories.join(' '));
  if (Array.isArray(place.amenities)) parts.push(place.amenities.join(' '));
  if (Array.isArray(place.reviewSnippets)) parts.push(place.reviewSnippets.join(' '));
  return normalize(parts.join(' '));
};

const hasKeyword = (haystack: string, keywords: string[]) =>
  keywords.some((keyword) => haystack.includes(normalize(keyword)));

const includesAnyType = (place: LocalPlace, types: Set<string>) => {
  const categories = (place.categories || []).map((cat) => normalize(cat));
  return categories.some((category) => types.has(category));
};

export const getFeatureChips = (place: LocalPlace): string[] => {
  const haystack = aggregateText(place);
  return FEATURE_CHIPS.filter((chip) => hasKeyword(haystack, chip.keywords)).map((chip) => chip.label);
};

export const calculatePlaceScore = (place: LocalPlace, filters: Filters): number => {
  let score = 50;
  const haystack = aggregateText(place);

  if (hasKeyword(haystack, INCLUSION_KEYWORDS)) {
    score += 15;
  }

  if (includesAnyType(place, CORE_KID_TYPES)) {
    score += 10;
  }

  if (
    typeof place.googleRating === 'number' &&
    place.googleRating >= 4.3 &&
    typeof place.googleUserRatingsTotal === 'number' &&
    place.googleUserRatingsTotal >= 50
  ) {
    score += 8;
  }

  if (
    hasKeyword(haystack, EXCLUSION_KEYWORDS) ||
    includesAnyType(place, EXCLUSION_TYPES)
  ) {
    score -= 20;
  }

  const preference: AgeFilter = filters.childrenAge || 'all';

  if (preference === '0-5') {
    if (hasKeyword(haystack, SMALL_KIDS_KEYWORDS)) {
      score += 10;
    }
    if (includesAnyType(place, SMALL_KIDS_TYPES)) {
      score += 8;
    }
  } else if (preference === '5+') {
    if (hasKeyword(haystack, BIG_KIDS_KEYWORDS)) {
      score += 10;
    }
    if (includesAnyType(place, BIG_KIDS_TYPES)) {
      score += 8;
    }
  }

  return Math.max(0, Math.min(100, score));
};

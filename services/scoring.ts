import type { Filters, LocalPlace } from '../types/models';

type AgeFilter = Filters['childrenAge'];

type FeatureChip = {
  id: string;
  label: string;
  keywords: string[];
};

type MentionCategory = 'kids-area' | 'playground' | 'monitors';

interface ReviewSource {
  text: string;
  rating?: number;
  createdAt?: number;
}

interface ReviewMention {
  category: MentionCategory;
  reviewIndex: number;
  rating?: number;
  createdAt?: number;
}

interface ReviewBonusResult {
  bonus: number;
  chips: string[];
  mentionCount: number;
  hasRecent: boolean;
  hasFiveStar: boolean;
}

interface PlaceScoreDetails {
  score: number;
  reviewBonus: number;
  reviewChips: string[];
}

const INCLUSION_KEYWORDS = [
  'kids',
  'kid',
  'child',
  'children',
  'family',
  'playground',
  'brinquedoteca',
  'parquinho',
  'espaco kids',
  'menu infantil',
  'kids-friendly',
  'kids friendly',
  'area kids',
];

const EXCLUSION_KEYWORDS = ['hotel', 'pousada', 'motel', 'resort', 'hostel'];
const EXCLUSION_TYPES = new Set(['lodging', 'hotel', 'motel', 'hostel']);

const CORE_KID_TYPES = new Set(['playground', 'park', 'amusement_park', 'zoo', 'aquarium', 'museum']);

const SMALL_KIDS_KEYWORDS = [
  'brinquedoteca',
  'fraldario',
  'troca de fraldas',
  'cadeirao',
  'menu infantil',
  'menu kids',
  'cantinho baby',
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
  'parque de diversao',
  'games',
];

const BIG_KIDS_TYPES = new Set(['amusement_park', 'tourist_attraction', 'recreation_center', 'shopping_mall']);

const FEATURE_CHIPS: FeatureChip[] = [
  { id: 'kids-area', label: 'Espaco kids', keywords: ['espaco kids', 'area kids', 'brinquedoteca'] },
  { id: 'menu-kids', label: 'Menu infantil', keywords: ['menu infantil', 'menu kids'] },
  { id: 'nursery', label: 'Fraldario', keywords: ['fraldario', 'troca de fraldas'] },
  { id: 'high-chair', label: 'Cadeirao', keywords: ['cadeirao', 'cadeira de bebe'] },
  { id: 'fenced', label: 'Area cercada', keywords: ['area cercada', 'espaco cercado'] },
  { id: 'monitors', label: 'Monitores', keywords: ['monitoria', 'monitores', 'monitor infantil'] },
];

const REVIEW_KEYWORDS: Record<MentionCategory, string[]> = {
  'kids-area': ['espaco kids', 'area kids', 'brinquedoteca', 'kids area', 'kids room', 'play area'],
  playground: ['parquinho', 'playground'],
  monitors: ['monitores', 'monitoria', 'recreadores', 'recreacao infantil', 'staff supervising', 'monitors'],
};

const REVIEW_CHIP_LABELS: Record<MentionCategory, string> = {
  'kids-area': 'Espaco kids citado',
  playground: 'Parquinho citado',
  monitors: 'Monitores citados',
};

const REVIEW_CHIP_ORDER: MentionCategory[] = ['kids-area', 'playground', 'monitors'];

const REVIEW_BONUS_TIERS: { min: number; bonus: number }[] = [
  { min: 7, bonus: 20 },
  { min: 4, bonus: 15 },
  { min: 2, bonus: 10 },
  { min: 1, bonus: 6 },
];

const REVIEW_RECENT_WINDOW_MS = 1000 * 60 * 60 * 24 * 30 * 6;
const REVIEW_MAX_BONUS = 25;

const NEGATION_HINTS_BEFORE = [
  'nao tem',
  'nao possui',
  'nao oferece',
  'nao tinha',
  'sem',
  'sem um',
  'sem uma',
  'sem nenhum',
  'sem nenhuma',
  'sem qualquer',
  'faltou',
  'inexistente',
];

const NEGATION_HINTS_AFTER = ['sem', 'faltou', 'inexistente', 'ausente'];

const NEGATIVE_CATEGORY_PHRASES: Record<MentionCategory, string[]> = {
  'kids-area': [
    'sem espaco kids',
    'sem area kids',
    'sem espaco infantil',
    'sem brinquedoteca',
    'nao tem espaco kids',
    'nao tem area kids',
    'nao tem brinquedoteca',
    'sem kids area',
    'nao tem kids area',
    'sem play area',
    'nao tem play area',
    'espaco kids inexistente',
    'area kids inexistente',
    'kids area inexistente',
  ],
  playground: [
    'sem playground',
    'sem parquinho',
    'nao tem playground',
    'nao tem parquinho',
    'playground inexistente',
    'parquinho inexistente',
  ],
  monitors: [
    'sem monitores',
    'nao tem monitores',
    'sem monitoria',
    'nao tem monitoria',
    'sem recreacao infantil',
    'nao tem recreacao infantil',
    'sem supervisao',
    'nao tem supervisao',
  ],
};

const normalize = (value: string) => {
  const normalized = (value ?? '')
    .toLowerCase()
    .normalize('NFD');

  return Array.from(normalized)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join('');
};

const aggregateText = (place: LocalPlace) => {
  const parts: string[] = [];
  if (place.name) parts.push(place.name);
  if (place.description) parts.push(place.description);
  if (Array.isArray(place.categories)) parts.push(place.categories.join(' '));
  if (Array.isArray(place.amenities)) parts.push(place.amenities.join(' '));
  if (Array.isArray(place.reviewSnippets)) parts.push(place.reviewSnippets.join(' '));
  if (Array.isArray(place.reviewHighlights)) {
    const highlightTexts = place.reviewHighlights
      .map((highlight) => highlight.text)
      .filter((text): text is string => typeof text === 'string');
    parts.push(highlightTexts.join(' '));
  }
  return normalize(parts.join(' '));
};

const hasKeyword = (haystack: string, keywords: string[]) =>
  keywords.some((keyword) => haystack.includes(normalize(keyword)));

const includesAnyType = (place: LocalPlace, types: Set<string>) => {
  const categories = (place.categories || []).map((cat) => normalize(cat));
  return categories.some((category) => types.has(category));
};

const collectReviewSources = (place: LocalPlace): ReviewSource[] => {
  if (Array.isArray(place.reviewHighlights) && place.reviewHighlights.length > 0) {
    return place.reviewHighlights
      .map((highlight) => ({
        text: typeof highlight.text === 'string' ? highlight.text.trim() : '',
        rating: highlight.rating,
        createdAt: typeof highlight.createdAt === 'number' ? highlight.createdAt : undefined,
      }))
      .filter((item) => item.text.length > 0);
  }

  if (Array.isArray(place.reviewSnippets) && place.reviewSnippets.length > 0) {
    return place.reviewSnippets
      .filter((snippet): snippet is string => typeof snippet === 'string' && snippet.trim().length > 0)
      .map((snippet) => ({ text: snippet.trim() }));
  }

  return [];
};

const isPositiveReview = (review: ReviewSource) => {
  if (typeof review.rating === 'number') {
    return review.rating >= 4;
  }
  return true;
};

const isNegatedMention = (
  normalizedText: string,
  normalizedKeyword: string,
  index: number,
  category: MentionCategory,
) => {
  const windowRadius = 24;
  const windowStart = Math.max(0, index - windowRadius);
  const windowEnd = Math.min(normalizedText.length, index + normalizedKeyword.length + windowRadius);
  const windowBefore = normalizedText.slice(windowStart, index).trimEnd();
  const windowAfter = normalizedText.slice(index + normalizedKeyword.length, windowEnd).trimStart();

  if (NEGATION_HINTS_BEFORE.some((hint) => windowBefore.endsWith(hint))) {
    return true;
  }

  if (NEGATION_HINTS_AFTER.some((hint) => windowAfter.startsWith(hint))) {
    return true;
  }

  const negativePhrases = NEGATIVE_CATEGORY_PHRASES[category] ?? [];
  if (negativePhrases.some((phrase) => normalizedText.includes(phrase))) {
    return true;
  }

  return false;
};

const collectMentions = (place: LocalPlace) => {
  const reviews = collectReviewSources(place);
  const mentions: ReviewMention[] = [];
  let hasRecent = false;
  let hasFiveStar = false;

  reviews.forEach((review, index) => {
    if (!isPositiveReview(review) || !review.text) {
      return;
    }

    const normalizedText = normalize(review.text);
    const categoriesInReview = new Set<MentionCategory>();

    (Object.entries(REVIEW_KEYWORDS) as [MentionCategory, string[]][]).forEach(([category, keywords]) => {
      keywords.forEach((keyword) => {
        const normalizedKeyword = normalize(keyword);
        if (!normalizedKeyword) {
          return;
        }

        let cursor = normalizedText.indexOf(normalizedKeyword);
        while (cursor !== -1) {
          if (!isNegatedMention(normalizedText, normalizedKeyword, cursor, category)) {
            categoriesInReview.add(category);
          }
          cursor = normalizedText.indexOf(normalizedKeyword, cursor + normalizedKeyword.length);
        }
      });
    });

    if (categoriesInReview.size === 0) {
      return;
    }

    if (typeof review.createdAt === 'number') {
      const delta = Date.now() - review.createdAt;
      if (!Number.isNaN(delta) && delta <= REVIEW_RECENT_WINDOW_MS) {
        hasRecent = true;
      }
    }

    if (review.rating === 5) {
      hasFiveStar = true;
    }

    categoriesInReview.forEach((category) => {
      mentions.push({ category, reviewIndex: index, rating: review.rating, createdAt: review.createdAt });
    });
  });

  const uniqueReviewCount = new Set(mentions.map((mention) => mention.reviewIndex)).size;
  return { mentions, uniqueReviewCount, hasRecent, hasFiveStar };
};

const buildReviewBonus = (place: LocalPlace, preference: AgeFilter): ReviewBonusResult => {
  const { mentions, uniqueReviewCount, hasRecent, hasFiveStar } = collectMentions(place);

  if (mentions.length === 0 || uniqueReviewCount === 0) {
    return { bonus: 0, chips: [], mentionCount: 0, hasRecent: false, hasFiveStar: false };
  }

  let baseBonus = 0;
  for (const tier of REVIEW_BONUS_TIERS) {
    if (uniqueReviewCount >= tier.min) {
      baseBonus = tier.bonus;
      break;
    }
  }

  if (baseBonus === 0) {
    return { bonus: 0, chips: [], mentionCount: uniqueReviewCount, hasRecent, hasFiveStar };
  }

  const mentionCounts = new Map<MentionCategory, number>();
  mentions.forEach((mention) => {
    mentionCounts.set(mention.category, (mentionCounts.get(mention.category) ?? 0) + 1);
  });

  const hasKidsArea = (mentionCounts.get('kids-area') ?? 0) > 0;
  const hasPlayground = (mentionCounts.get('playground') ?? 0) > 0;

  const hasMonitors = (mentionCounts.get('monitors') ?? 0) > 0;

  let adjustedBonus = baseBonus;

  if (preference === '0-5' && (hasKidsArea || hasPlayground)) {
    adjustedBonus *= 2;
  } else if (preference === '5+' && hasMonitors) {
    adjustedBonus *= 1.5;
  }

  if (hasRecent) {
    adjustedBonus += 3;
  }
  if (hasFiveStar) {
    adjustedBonus += 2;
  }

  const cappedBonus = Math.min(REVIEW_MAX_BONUS, adjustedBonus);

  const chips = REVIEW_CHIP_ORDER
    .filter((category) => (mentionCounts.get(category) ?? 0) > 0)
    .map((category) => REVIEW_CHIP_LABELS[category]);

  return {
    bonus: cappedBonus,
    chips,
    mentionCount: uniqueReviewCount,
    hasRecent,
    hasFiveStar,
  };
};

export const getFeatureChips = (place: LocalPlace): string[] => {
  const haystack = aggregateText(place);
  return FEATURE_CHIPS.filter((chip) => hasKeyword(haystack, chip.keywords)).map((chip) => chip.label);
};

export const scorePlaceWithDetails = (place: LocalPlace, filters: Filters): PlaceScoreDetails => {
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

  const reviewBonus = buildReviewBonus(place, preference);
  score += reviewBonus.bonus;

  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    reviewBonus: reviewBonus.bonus,
    reviewChips: reviewBonus.chips,
  };
};

export const calculatePlaceScore = (place: LocalPlace, filters: Filters): number =>
  scorePlaceWithDetails(place, filters).score;

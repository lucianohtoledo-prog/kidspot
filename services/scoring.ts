import type { Filters, LocalPlace } from '../types/models';

export type PlacePriorityLayer = 'A' | 'B' | 'C' | 'D';

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

interface ReviewSignals {
  mentionReviewCounts: Record<MentionCategory, number>;
  recentMentionReviewCounts: Record<MentionCategory, number>;
  mentionChips: string[];
  totalMentionReviewCount: number;
  recentMentionReviewCount: number;
  hasRecentKidsMention: boolean;
  monitorsMentioned: boolean;
  kidsAreaMentioned: boolean;
  playgroundMentioned: boolean;
}

export interface PlaceScoreDetails {
  score: number;
  reviewBonus: number;
  reviewChips: string[];
  priorityLayer: PlacePriorityLayer;
  badges: string[];
  shouldHide: boolean;
}

const BASE_SCORE = 20;
const LAYER_BONUS: Record<PlacePriorityLayer, number> = { A: 40, B: 28, C: 10, D: 0 };
const MONITORS_LAYER_B_BONUS = 6;

const RECENT_MENTION_WINDOW_MS = 1000 * 60 * 60 * 24 * 365;

const HOTEL_TYPES = new Set(['lodging', 'hotel', 'motel', 'hostel', 'resort']);
const HOTEL_KEYWORDS = ['hotel', 'pousada', 'resort', 'hostel', 'inn', 'pousada infantil', 'apart hotel'];
const ADULT_TYPES = new Set(['bar', 'night_club', 'liquor_store', 'casino', 'wine_bar']);
const ADULT_KEYWORDS = ['balada', 'boate', 'pub', 'wine bar', 'vinho', 'boteco', 'choperia', 'cocktail', 'speakeasy', 'whisky'];
const ROMANTIC_KEYWORDS = ['romantico', 'silencioso', 'adult only', 'som baixo', 'casal', 'para casais', 'fine dining'];

const DEDICATED_TYPES = new Set([
  'playground',
  'amusement_park',
  'theme_park',
  'bowling_alley',
  'trampoline_park',
  'arcade',
  'laser_tag_center',
  'children_museum',
  'indoor_play_area',
]);
const ACTIVE_TYPES = new Set([
  'amusement_park',
  'theme_park',
  'bowling_alley',
  'trampoline_park',
  'arcade',
  'laser_tag_center',
  'recreation_center',
]);

const FOOD_CATEGORIES = new Set([
  'restaurant',
  'food',
  'cafe',
  'bakery',
  'barbecue',
  'meal_takeaway',
  'meal_delivery',
  'coffee_shop',
  'ice_cream',
  'pizzeria',
  'steakhouse',
  'confectionery',
]);

const FOOD_KEYWORDS = [
  'restaurante',
  'restaurant',
  'cafe',
  'cafeteria',
  'padaria',
  'bakery',
  'lanchonete',
  'sorveteria',
  'bistro',
  'pizzaria',
  'churrascaria',
  'brasserie',
  'doceria',
];

const DEDICATED_KIDS_KEYWORDS = [
  'brinquedoteca',
  'buffet infantil',
  'casa de festas infantil',
  'casa de festa infantil',
  'playground indoor',
  'playground coberto',
  'parque infantil',
  'parque kids',
  'parque de trampolim',
  'trampoline park',
  'jump park',
  'trampolim',
  'arcade',
  'laser tag',
  'boliche',
  'bowling',
  'recreacao infantil',
  'recreacao monitorada',
  'museu infantil',
  'aquario infantil',
  'zoologico infantil',
];

const DEDICATED_EVENT_KEYWORDS = [
  'buffet infantil',
  'casa de festas infantil',
  'festa infantil',
  'aniversario infantil',
  'espaco festa infantil',
];

const KIDS_AREA_KEYWORDS = [
  'espaco kids',
  'area kids',
  'kids area',
  'kids space',
  'kids zone',
  'kids corner',
  'sala kids',
  'sala infantil',
  'brinquedoteca',
  'play area',
];

const PLAYGROUND_KEYWORDS = [
  'playground',
  'parquinho',
  'praca infantil',
  'espaco brincar',
  'espaco de brincar',
  'play kids',
  'brinquedos ao ar livre',
];

const MONITOR_KEYWORDS = [
  'monitores',
  'monitoria',
  'monitor infantil',
  'recreacao infantil',
  'recreadores',
  'recreacao monitorada',
  'animacao infantil',
  'staff supervisionado',
];

const ACTIVE_PLAY_KEYWORDS = [
  'trampolim',
  'trampoline',
  'jump',
  'pista de aventura',
  'escalada',
  'climbing',
  'parkour',
  'arvorismo',
  'tirolesa',
  'arcade',
  'laser tag',
  'boliche',
  'bowling',
  'kart',
  'games',
  'arena kids',
];

const FAMILY_KEYWORDS = [
  'kids friendly',
  'kid friendly',
  'family friendly',
  'familia',
  'criancas',
  'para criancas',
  'lugar para familia',
];

const BABY_SUPPORT_KEYWORDS = [
  'fraldario',
  'troca de fraldas',
  'cantinho baby',
  'baby care',
  'amamentacao',
  'lactario',
  'espaco baby',
];

const HIGHCHAIR_KEYWORDS = [
  'cadeirao',
  'cadeira de bebe',
  'cadeirao infantil',
];

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

type BonusFlavor = 'small' | 'active' | 'neutral';

const normalize = (value: string) => {
  const normalized = (value ?? '').toLowerCase().normalize('NFD');
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
  const sources: ReviewSource[] = [];
  if (Array.isArray(place.reviewHighlights)) {
    place.reviewHighlights.forEach((highlight) => {
      if (!highlight?.text) {
        return;
      }
      sources.push({
        text: highlight.text,
        rating: highlight.rating,
        createdAt: highlight.createdAt,
      });
    });
  }
  if (Array.isArray(place.reviewSnippets)) {
    place.reviewSnippets.forEach((snippet) => {
      if (!snippet) {
        return;
      }
      sources.push({ text: snippet });
    });
  }
  return sources;
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

const analyzeReviewSignals = (place: LocalPlace): ReviewSignals => {
  const reviews = collectReviewSources(place);
  const mentionReviewSets: Record<MentionCategory, Set<number>> = {
    'kids-area': new Set(),
    playground: new Set(),
    monitors: new Set(),
  };
  const recentMentionReviewSets: Record<MentionCategory, Set<number>> = {
    'kids-area': new Set(),
    playground: new Set(),
    monitors: new Set(),
  };
  const mentionGlobal = new Set<number>();
  const recentGlobal = new Set<number>();
  const now = Date.now();

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

    const reviewTimestamp = typeof review.createdAt === 'number' ? review.createdAt : undefined;
    const isRecent =
      typeof reviewTimestamp === 'number' &&
      !Number.isNaN(reviewTimestamp) &&
      now - reviewTimestamp <= RECENT_MENTION_WINDOW_MS;

    categoriesInReview.forEach((category) => {
      mentionReviewSets[category].add(index);
      if (isRecent) {
        recentMentionReviewSets[category].add(index);
      }
    });

    mentionGlobal.add(index);
    if (isRecent) {
      recentGlobal.add(index);
    }
  });

  const mentionReviewCounts: Record<MentionCategory, number> = {
    'kids-area': mentionReviewSets['kids-area'].size,
    playground: mentionReviewSets.playground.size,
    monitors: mentionReviewSets.monitors.size,
  };

  const recentMentionReviewCounts: Record<MentionCategory, number> = {
    'kids-area': recentMentionReviewSets['kids-area'].size,
    playground: recentMentionReviewSets.playground.size,
    monitors: recentMentionReviewSets.monitors.size,
  };

  const kidsAreaMentioned = mentionReviewCounts['kids-area'] > 0;
  const playgroundMentioned = mentionReviewCounts.playground > 0;
  const monitorsMentioned = mentionReviewCounts.monitors > 0;

  const hasRecentKidsMention =
    recentMentionReviewCounts['kids-area'] > 0 || recentMentionReviewCounts.playground > 0;

  const mentionChips = REVIEW_CHIP_ORDER.filter((category) => mentionReviewCounts[category] > 0).map(
    (category) => REVIEW_CHIP_LABELS[category],
  );

  return {
    mentionReviewCounts,
    recentMentionReviewCounts,
    mentionChips,
    totalMentionReviewCount: mentionGlobal.size,
    recentMentionReviewCount: recentGlobal.size,
    hasRecentKidsMention,
    monitorsMentioned,
    kidsAreaMentioned,
    playgroundMentioned,
  };
};

const applyAgeMultiplier = (value: number, flavor: BonusFlavor, preference: AgeFilter): number => {
  if (!value) {
    return 0;
  }
  if (preference === '0-5' && flavor === 'small') {
    return value * 2;
  }
  if (preference === '5+' && flavor === 'active') {
    return value * 1.5;
  }
  return value;
};

const isFoodVenue = (place: LocalPlace, haystack: string) =>
  includesAnyType(place, FOOD_CATEGORIES) || hasKeyword(haystack, FOOD_KEYWORDS);

export const getFeatureChips = (place: LocalPlace): string[] => {
  const haystack = aggregateText(place);
  return FEATURE_CHIPS.filter((chip) => hasKeyword(haystack, chip.keywords)).map((chip) => chip.label);
};

export const scorePlaceWithDetails = (place: LocalPlace, filters: Filters): PlaceScoreDetails => {
  const preference: AgeFilter = filters.childrenAge || 'all';
  const haystack = aggregateText(place);

  const isHotel =
    includesAnyType(place, HOTEL_TYPES) || hasKeyword(haystack, HOTEL_KEYWORDS);

  if (isHotel) {
    return {
      score: 0,
      reviewBonus: 0,
      reviewChips: [],
      priorityLayer: 'D',
      badges: [],
      shouldHide: true,
    };
  }

  const reviewSignals = analyzeReviewSignals(place);

  const isAdultSpot = includesAnyType(place, ADULT_TYPES) || hasKeyword(haystack, ADULT_KEYWORDS);
  const isRomanticSpot = hasKeyword(haystack, ROMANTIC_KEYWORDS);
  const foodVenue = isFoodVenue(place, haystack);

  const hasKidsAreaKeyword =
    hasKeyword(haystack, KIDS_AREA_KEYWORDS) || (place.amenities || []).includes('playroom');
  const hasPlaygroundAmenity = (place.amenities || []).includes('playground');
  const hasPlaygroundKeyword = hasKeyword(haystack, PLAYGROUND_KEYWORDS);
  const hasPlaygroundEvidence =
    hasPlaygroundAmenity || hasPlaygroundKeyword || reviewSignals.playgroundMentioned;

  const hasMonitorsAmenity = (place.amenities || []).includes('monitors');
  const hasMonitorsKeyword = hasKeyword(haystack, MONITOR_KEYWORDS);
  const monitorsEvidence =
    hasMonitorsAmenity || hasMonitorsKeyword || reviewSignals.monitorsMentioned;

  const hasActivePlayKeyword =
    hasKeyword(haystack, ACTIVE_PLAY_KEYWORDS) || includesAnyType(place, ACTIVE_TYPES);
  const hasBabySupportKeyword = hasKeyword(haystack, BABY_SUPPORT_KEYWORDS);
  const hasHighChairKeyword = hasKeyword(haystack, HIGHCHAIR_KEYWORDS);
  const hasFamilyKeyword = hasKeyword(haystack, FAMILY_KEYWORDS);

  const dedicatedType = includesAnyType(place, DEDICATED_TYPES);
  const eventKeyword = hasKeyword(haystack, DEDICATED_EVENT_KEYWORDS);
  const dedicatedKeyword = hasKeyword(haystack, DEDICATED_KIDS_KEYWORDS);

  const kidsAreaMentions = reviewSignals.mentionReviewCounts['kids-area'];
  const playgroundMentions = reviewSignals.mentionReviewCounts.playground;
  const monitorsMentions = reviewSignals.mentionReviewCounts.monitors;
  const recentKidsMentions =
    reviewSignals.recentMentionReviewCounts['kids-area'] +
    reviewSignals.recentMentionReviewCounts.playground;

  const strongReviewEvidence =
    kidsAreaMentions + playgroundMentions >= 3 || recentKidsMentions >= 2;

  const strongKidsArea =
    hasKidsAreaKeyword || strongReviewEvidence || reviewSignals.kidsAreaMentioned;

  const dedicatedForKids =
    eventKeyword ||
    dedicatedType ||
    (!foodVenue && (dedicatedKeyword || hasActivePlayKeyword)) ||
    (!foodVenue && strongKidsArea);

  let priorityLayer: PlacePriorityLayer = 'D';

  if (dedicatedForKids) {
    priorityLayer = 'A';
  } else if (foodVenue && strongKidsArea) {
    priorityLayer = 'B';
  } else if (
    hasFamilyKeyword ||
    strongKidsArea ||
    reviewSignals.totalMentionReviewCount > 0 ||
    hasPlaygroundEvidence ||
    hasActivePlayKeyword
  ) {
    priorityLayer = 'C';
  } else {
    priorityLayer = 'D';
  }

  const badges = new Set<string>();
  if (priorityLayer === 'A') {
    badges.add('Infantil dedicado');
  }
  if (strongKidsArea) {
    badges.add('Area kids forte');
  }
  if (monitorsEvidence) {
    badges.add('Monitores');
  }
  if (hasPlaygroundEvidence) {
    badges.add('Parquinho');
  }

  let score = BASE_SCORE;
  let reviewBonus = 0;

  const addFeatureBonus = (value: number, flavor: BonusFlavor) => {
    const adjusted = applyAgeMultiplier(value, flavor, preference);
    score += adjusted;
    return adjusted;
  };

  const addReviewBonus = (value: number, flavor: BonusFlavor) => {
    const adjusted = applyAgeMultiplier(value, flavor, preference);
    reviewBonus += adjusted;
    score += adjusted;
    return adjusted;
  };

  score += LAYER_BONUS[priorityLayer];

  if (
    typeof place.googleRating === 'number' &&
    typeof place.googleUserRatingsTotal === 'number'
  ) {
    if (place.googleRating >= 4.3 && place.googleUserRatingsTotal >= 100) {
      addFeatureBonus(8, 'neutral');
    } else if (place.googleRating >= 4.3 && place.googleUserRatingsTotal >= 50) {
      addFeatureBonus(4, 'neutral');
    }
  }

  if (hasKidsAreaKeyword) {
    addFeatureBonus(8, 'small');
  }

  if ((place.amenities || []).includes('playroom')) {
    addFeatureBonus(6, 'small');
  }

  if (hasPlaygroundEvidence) {
    addFeatureBonus(6, 'small');
  }

  if ((place.amenities || []).includes('changing_table') || hasBabySupportKeyword) {
    addFeatureBonus(4, 'small');
  }

  if ((place.amenities || []).includes('kids_menu')) {
    addFeatureBonus(3, 'small');
  }

  if (hasHighChairKeyword) {
    addFeatureBonus(4, 'small');
  }

  if (monitorsEvidence) {
    addFeatureBonus(4, 'active');
  }

  if (hasActivePlayKeyword) {
    addFeatureBonus(8, 'active');
  }

  if (hasFamilyKeyword) {
    addFeatureBonus(4, 'neutral');
  }

  if (kidsAreaMentions > 0) {
    const base = Math.min(18, kidsAreaMentions * 6);
    addReviewBonus(base, 'small');
  }

  if (playgroundMentions > 0) {
    const base = Math.min(15, playgroundMentions * 5);
    addReviewBonus(base, 'small');
  }

  if (monitorsMentions > 0) {
    const base = Math.min(12, monitorsMentions * 4);
    addReviewBonus(base, 'active');
  }

  if (priorityLayer === 'B' && (monitorsMentions > 0 || hasMonitorsKeyword)) {
    addReviewBonus(MONITORS_LAYER_B_BONUS, 'active');
  }

  if (reviewSignals.hasRecentKidsMention) {
    addReviewBonus(4, 'small');
  }

  if (reviewSignals.totalMentionReviewCount >= 5) {
    addReviewBonus(3, 'neutral');
  }

  if (isAdultSpot) {
    score -= 15;
  }

  if (isRomanticSpot) {
    score -= 8;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    reviewBonus,
    reviewChips: reviewSignals.mentionChips,
    priorityLayer,
    badges: Array.from(badges),
    shouldHide: false,
  };
};

export const calculatePlaceScore = (place: LocalPlace, filters: Filters): number =>
  scorePlaceWithDetails(place, filters).score;

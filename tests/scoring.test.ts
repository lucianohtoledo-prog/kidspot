import { describe, expect, it } from 'vitest';
import type { Filters, LocalPlace } from '../types/models';
import { calculatePlaceScore } from '../services/scoring';

const basePlace: LocalPlace = {
  id: 'p1',
  name: 'Restaurante Família Feliz',
  description: 'Restaurante com brinquedoteca e menu infantil.',
  categories: ['restaurant'],
  coords: { lat: -23.5, lng: -46.6 },
  amenities: ['playroom', 'kids_menu'],
  googleRating: 4.5,
  googleUserRatingsTotal: 120,
  reviewSnippets: ['Excelente para crianças', 'Tem menu infantil e monitores.'],
};

const baseFilters: Filters = {
  radiusKm: 4,
  childrenAge: '0-5',
  environment: 'any',
  amenities: [],
  cuisine: [],
  openNow: false,
  category: 'all',
};

describe('calculatePlaceScore', () => {
  it('boosts score for 0-5 profile with infant keywords and amenities', () => {
    const score = calculatePlaceScore(basePlace, baseFilters);
    expect(score).toBeGreaterThanOrEqual(83);
  });

  it('applies 5+ boosters when keywords and types match older kids profile', () => {
    const arcadePlace: LocalPlace = {
      ...basePlace,
      id: 'p2',
      name: 'Arcade Max',
      description: 'Arcade com laser tag e pistas radicais.',
      categories: ['amusement_park'],
      reviewSnippets: ['Perfeito para crianças maiores com laser tag e arcade.'],
    };

    const filters: Filters = { ...baseFilters, childrenAge: '5+' };
    const score = calculatePlaceScore(arcadePlace, filters);
    expect(score).toBeGreaterThanOrEqual(83);
  });

  it('penalises exclusion keywords', () => {
    const hotelPlace: LocalPlace = {
      ...basePlace,
      id: 'p3',
      name: 'Hotel Resort Kids',
      description: 'Hotel com estrutura kids.',
      categories: ['lodging'],
    };

    const score = calculatePlaceScore(hotelPlace, baseFilters);
    expect(score).toBeLessThan(50);
  });
});


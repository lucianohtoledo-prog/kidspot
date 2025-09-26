import { describe, expect, it } from 'vitest';
import type { Filters, LocalPlace } from '../types/models';
import { calculatePlaceScore, scorePlaceWithDetails } from '../services/scoring';

const basePlace: LocalPlace = {
  id: 'p1',
  name: 'Restaurante Familia Feliz',
  description: 'Restaurante com brinquedoteca e menu infantil.',
  categories: ['restaurant'],
  coords: { lat: -23.5, lng: -46.6 },
  amenities: ['playroom', 'kids_menu'],
  googleRating: 4.5,
  googleUserRatingsTotal: 120,
  reviewSnippets: ['Excelente para criancas', 'Tem menu infantil e monitores.'],
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
    const details = scorePlaceWithDetails(basePlace, baseFilters);
    expect(details.score).toBeGreaterThanOrEqual(88);
    expect(details.reviewBonus).toBeGreaterThanOrEqual(6);
  });

  it('applies 5+ boosters when keywords and types match older kids profile', () => {
    const arcadePlace: LocalPlace = {
      ...basePlace,
      id: 'p2',
      name: 'Arcade Max',
      description: 'Arcade com laser tag e pistas radicais.',
      categories: ['amusement_park'],
      reviewSnippets: ['Perfeito para criancas maiores com laser tag e arcade.'],
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
      description: 'Hotel focado em adultos, sem estrutura familiar.',
      categories: ['lodging'],
      amenities: [],
      reviewSnippets: [],
    };

    const score = calculatePlaceScore(hotelPlace, baseFilters);
    expect(score).toBeLessThan(60);
  });

  it('doubles kids-area mentions for 0-5 profile', () => {
    const kidsAreaPlace: LocalPlace = {
      ...basePlace,
      id: 'p4',
      reviewHighlights: [
        { text: 'Espaco kids incrivel e bem cuidado!', rating: 5, createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30 },
        { text: 'Brinquedoteca com monitores super queridos.', rating: 4 },
      ],
    };

    const details = scorePlaceWithDetails(kidsAreaPlace, baseFilters);
    expect(details.reviewBonus).toBeGreaterThanOrEqual(20);
    expect(details.reviewChips).toContain('Espaco kids citado');
    expect(details.reviewChips).toContain('Monitores citados');
  });

  it('ups monitors weight for 5+ preference and ignores negative mentions', () => {
    const monitorsPlace: LocalPlace = {
      ...basePlace,
      id: 'p5',
      reviewHighlights: [
        { text: 'Monitores super animados e atentos!', rating: 5 },
        { text: 'Nao tem playground, mas os monitores fazem recreacao infantil otima.', rating: 4 },
        { text: 'Sem espaco kids, apenas mesas.', rating: 4 },
      ],
    };

    const filters: Filters = { ...baseFilters, childrenAge: '5+' };
    const details = scorePlaceWithDetails(monitorsPlace, filters);
    expect(details.reviewBonus).toBeGreaterThan(12);
    expect(details.reviewChips).toEqual(['Monitores citados']);
  });
});

import { describe, expect, it } from 'vitest';
import type { Filters, LocalPlace } from '../types/models';
import { scorePlaceWithDetails } from '../services/scoring';

const baseFilters: Filters = {
  radiusKm: 4,
  childrenAge: 'all',
  environment: 'any',
  amenities: [],
  cuisine: [],
  openNow: false,
  category: 'all',
};

const recentTimestamp = Date.now() - 1000 * 60 * 60 * 24 * 45;

describe('scorePlaceWithDetails', () => {
  it('prioritises dedicated kids venues in layer A with full badges', () => {
    const dedicatedPlace: LocalPlace = {
      id: 'dedicated',
      name: 'Jump Mania Kids',
      description: 'Parque de trampolim indoor com brinquedoteca completa e monitoria infantil.',
      categories: ['amusement_park'],
      coords: { lat: 0, lng: 0 },
      amenities: ['playroom', 'monitors', 'playground'],
      googleRating: 4.7,
      googleUserRatingsTotal: 220,
      reviewHighlights: [
        { text: 'Espaco kids gigante com monitores e brinquedoteca impecavel.', rating: 5, createdAt: recentTimestamp },
        { text: 'Parquinho indoor seguro e recreacao monitorada todos os dias.', rating: 5 },
      ],
    };

    const details = scorePlaceWithDetails(dedicatedPlace, baseFilters);
    expect(details.priorityLayer).toBe('A');
    expect(details.badges).toEqual(expect.arrayContaining(['Infantil dedicado', 'Area kids forte', 'Monitores', 'Parquinho']));
    expect(details.score).toBeGreaterThanOrEqual(90);
    expect(details.reviewBonus).toBeGreaterThanOrEqual(18);
  });

  it('classifies restaurant with strong kids area as layer B and rewards monitor mentions', () => {
    const restaurant: LocalPlace = {
      id: 'restaurant',
      name: 'Restaurante Alegria Kids',
      description: 'Restaurante familiar com brinquedoteca, area kids e playground coberto.',
      categories: ['restaurant'],
      coords: { lat: 0, lng: 0 },
      amenities: ['playroom', 'monitors', 'kids_menu'],
      googleRating: 4.4,
      googleUserRatingsTotal: 180,
      reviewHighlights: [
        { text: 'Espaco kids muito completo, com brinquedoteca monitorada.', rating: 5, createdAt: recentTimestamp },
        { text: 'Playground indoor com monitores super atentos as criancas.', rating: 5 },
        { text: 'Area kids excelente e monitoria infantil animada.', rating: 4 },
      ],
    };

    const details = scorePlaceWithDetails(restaurant, baseFilters);
    expect(details.priorityLayer).toBe('B');
    expect(details.badges).toEqual(expect.arrayContaining(['Area kids forte', 'Monitores']));
    expect(details.reviewChips).toEqual(expect.arrayContaining(['Espaco kids citado', 'Monitores citados']));
    expect(details.reviewBonus).toBeGreaterThanOrEqual(30);
  });

  it('hides lodging options from the ranking', () => {
    const hotel: LocalPlace = {
      id: 'hotel',
      name: 'Hotel Resort Exclusivo',
      description: 'Hotel focado em adultos, sem estrutura kids.',
      categories: ['hotel'],
      coords: { lat: 0, lng: 0 },
      amenities: [],
    };

    const details = scorePlaceWithDetails(hotel, baseFilters);
    expect(details.shouldHide).toBe(true);
    expect(details.score).toBe(0);
  });

  it('doubles small kids bonuses for 0-5 preference', () => {
    const place: LocalPlace = {
      id: 'smalls',
      name: 'Cafe Brincar',
      description: 'Cafe com brinquedoteca e fraldario completo.',
      categories: ['cafe'],
      coords: { lat: 0, lng: 0 },
      amenities: ['playroom', 'changing_table'],
      googleRating: 4.3,
      googleUserRatingsTotal: 80,
      reviewHighlights: [
        { text: 'Brinquedoteca lindinha, area kids segura e fraldario limpinho.', rating: 5, createdAt: recentTimestamp },
      ],
    };

    const scoreForToddlers = scorePlaceWithDetails(place, { ...baseFilters, childrenAge: '0-5' });
    const scoreForOlderKids = scorePlaceWithDetails(place, { ...baseFilters, childrenAge: '5+' });
    expect(scoreForToddlers.score).toBeGreaterThan(scoreForOlderKids.score);
    expect(scoreForToddlers.reviewBonus).toBeGreaterThan(scoreForOlderKids.reviewBonus);
  });

  it('boosts active play venues for 5+ preference', () => {
    const activePlace: LocalPlace = {
      id: 'active',
      name: 'Arena Laser & Arcade',
      description: 'Arcade com laser tag, trampolim e recreacao monitorada para criancas maiores.',
      categories: ['arcade'],
      coords: { lat: 0, lng: 0 },
      amenities: ['monitors'],
      reviewHighlights: [
        { text: 'Laser tag incrivel com monitores animados!', rating: 5, createdAt: recentTimestamp },
        { text: 'Trampolim e pista de escalada para os maiores.', rating: 4 },
      ],
    };

    const detailsOlder = scorePlaceWithDetails(activePlace, { ...baseFilters, childrenAge: '5+' });
    const detailsToddlers = scorePlaceWithDetails(activePlace, { ...baseFilters, childrenAge: '0-5' });
    expect(detailsOlder.score).toBeGreaterThan(detailsToddlers.score);
  });
});

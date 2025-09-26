import Constants from 'expo-constants';
import type { LocalPlace, ReviewHighlight } from '../types/models';

const extra = Constants?.expoConfig?.extra as any;
const apiKey = extra?.GOOGLE_MAPS_API_KEY || '';

const REQUEST_TIMEOUT_MS = 15000;
const MAX_REVIEW_PLACES = 8;
const MAX_REVIEW_HIGHLIGHTS = 8;

export const isPlacesConfigured = !!apiKey;

type PlacesApiResponse = { results?: any[]; status?: string; error_message?: string };

type PlaceDetailsResponse = { result?: any; status?: string; error_message?: string };

async function fetchJsonWithTimeout<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.info('Places request failed', { url, status: response.status });
      return null;
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    const errorName = (error as { name?: string } | null)?.name;
    if (errorName === 'AbortError') {
      console.info('Places request aborted (timeout)', { url });
    } else {
      console.info('Places request threw', { url, error });
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractResults(data: PlacesApiResponse | null) {
  if (!data) return [];
  if (data.status && data.status !== 'OK') {
    console.info('Places API returned non-OK status', {
      status: data.status,
      error: data.error_message,
    });
    return [];
  }
  return data.results || [];
}

const NEARBY_BASE_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const TEXT_SEARCH_BASE_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const PLACE_DETAILS_FIELDS = [
  'name',
  'formatted_address',
  'formatted_phone_number',
  'website',
  'opening_hours',
  'rating',
  'user_ratings_total',
  'photos',
  'place_id',
  'geometry',
  'reviews',
].join(',');

// Minimal helpers to query Google Places Web Service (Nearby Search)
export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  type?: string,
  keyword?: string,
) {
  if (!isPlacesConfigured) return [];

  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radiusMeters),
    key: apiKey,
  });

  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) {
    params.append('keyword', trimmedKeyword);
  }
  if (type?.trim()) {
    params.append('type', type.trim());
  }

  const url = `${NEARBY_BASE_URL}?${params.toString()}`;
  const data = await fetchJsonWithTimeout<PlacesApiResponse>(url);
  return extractResults(data);
}

export async function fetchTextSearchPlaces(
  query: string,
  lat: number,
  lng: number,
  radiusMeters: number,
) {
  if (!isPlacesConfigured) return [];
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const params = new URLSearchParams({
    query: trimmedQuery,
    location: `${lat},${lng}`,
    radius: String(radiusMeters),
    key: apiKey,
  });

  const url = `${TEXT_SEARCH_BASE_URL}?${params.toString()}`;
  const data = await fetchJsonWithTimeout<PlacesApiResponse>(url);
  return extractResults(data);
}

export async function fetchPlaceDetails(placeId: string) {
  if (!isPlacesConfigured) return null;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${PLACE_DETAILS_FIELDS}&key=${apiKey}`;
  const data = await fetchJsonWithTimeout<PlaceDetailsResponse>(url);
  if (!data) return null;
  if (data.status && data.status !== 'OK') {
    console.info('Place details API returned non-OK status', {
      status: data.status,
      error: data.error_message,
    });
    return null;
  }
  return data.result || null;
}

const normalizeReviewText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
};

const mapGoogleReviewToHighlight = (review: any): ReviewHighlight | null => {
  const primary = normalizeReviewText(review?.text);
  const fallback = normalizeReviewText(review?.original_text?.text);
  const text = primary || fallback;
  if (!text) {
    return null;
  }

  const highlight: ReviewHighlight = { text };
  if (typeof review?.rating === 'number') {
    highlight.rating = review.rating;
  }
  if (typeof review?.time === 'number' && Number.isFinite(review.time)) {
    highlight.createdAt = review.time * 1000;
  }
  return highlight;
};

// Map Google result to LocalPlace-like structure (best-effort)
export function mapGoogleToLocal(place: any): LocalPlace {
  return {
    id: place.place_id,
    name: place.name,
    description: '',
    categories: ['google'],
    coords: {
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
    },
    address: place.formatted_address,
    phone: place.formatted_phone_number,
    website: place.website,
    googlePlaceId: place.place_id,
    googleRating: typeof place.rating === 'number' ? place.rating : undefined,
    googleUserRatingsTotal: typeof place.user_ratings_total === 'number' ? place.user_ratings_total : undefined,
    kidspotRating: undefined,
    openingHours: place.opening_hours?.weekday_text || [],
    amenities: [],
    ageRange: 'all',
    cuisine: [],
    boostedUntil: null,
    status: 'approved',
    photos: (place.photos || []).slice(0, 6).map((p: any) => p.photo_reference),
  };
}

export async function enrichPlacesWithReviews(places: LocalPlace[], limit = MAX_REVIEW_PLACES): Promise<LocalPlace[]> {
  if (!isPlacesConfigured || places.length === 0) {
    return places;
  }

  const cloned = places.map((place) => ({ ...place }));
  const candidates = cloned
    .filter((place) => !(place.reviewHighlights?.length) && (place.googlePlaceId || place.id))
    .slice(0, Math.max(0, limit));

  if (candidates.length === 0) {
    return cloned;
  }

  await Promise.all(
    candidates.map(async (place) => {
      const placeId = place.googlePlaceId || place.id;
      const details = await fetchPlaceDetails(placeId);
      if (!details) {
        return;
      }

      if (typeof details.rating === 'number') {
        place.googleRating = details.rating;
      }
      if (typeof details.user_ratings_total === 'number') {
        place.googleUserRatingsTotal = details.user_ratings_total;
      }

      const rawReviews = Array.isArray(details.reviews) ? details.reviews : [];
      if (rawReviews.length === 0) {
        return;
      }

      const highlights = rawReviews
        .map(mapGoogleReviewToHighlight)
        .filter((highlight: ReviewHighlight | null): highlight is ReviewHighlight => !!highlight)
        .slice(0, MAX_REVIEW_HIGHLIGHTS);

      if (highlights.length > 0) {
        place.reviewHighlights = highlights;
      } else if (!place.reviewSnippets) {
        const snippets = rawReviews
          .map((review: any) => normalizeReviewText(review?.text) || normalizeReviewText(review?.original_text?.text))
          .filter((text: string | null): text is string => !!text)
          .slice(0, MAX_REVIEW_HIGHLIGHTS);
        if (snippets.length > 0) {
          place.reviewSnippets = snippets;
        }
      }
    }),
  );

  return cloned;
}

export function googlePhotoUrl(photoRef: string, maxWidth = 800) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${apiKey}`;
}

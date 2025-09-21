import Constants from 'expo-constants';
import type { LocalPlace } from '../types/models';

const extra = Constants?.expoConfig?.extra as any;
const apiKey = extra?.GOOGLE_MAPS_API_KEY || '';

const REQUEST_TIMEOUT_MS = 15000;

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

// Minimal helpers to query Google Places Web Service (Nearby Search)
export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  type?: string,
  keyword?: string
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
  radiusMeters: number
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

  const fields = [
    'name',
    'formatted_address',
    'formatted_phone_number',
    'website',
    'opening_hours',
    'rating',
    'photos',
    'place_id',
    'geometry',
  ].join(',');
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
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
    googleRating: place.rating,
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

export function googlePhotoUrl(photoRef: string, maxWidth = 800) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${apiKey}`;
}

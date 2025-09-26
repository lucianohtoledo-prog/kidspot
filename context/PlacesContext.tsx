import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { scorePlace } from '../services/curation';
import {
  fetchNearbyPlaces,
  fetchTextSearchPlaces,
  mapGoogleToLocal,
  isPlacesConfigured,
} from '../services/places';
import type { LocalPlace } from '../types/models';

interface RefreshOptions {
  keyword?: string;
  radiusMeters?: number;
}

interface PlacesContextValue {
  places: LocalPlace[];
  loading: boolean;
  refresh: (center?: { lat: number; lng: number }, options?: RefreshOptions) => Promise<void>;
  setPlaces: React.Dispatch<React.SetStateAction<LocalPlace[]>>;
}

const PlacesContext = createContext<PlacesContextValue>({} as any);
export const usePlaces = () => useContext(PlacesContext);

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const matchesKeyword = (place: LocalPlace, keyword: string) => {
  const normalizedKeyword = normalizeText(keyword);
  const candidates = [place.name, place.address, place.description, ...(place.categories || [])].filter(Boolean) as string[];
  return candidates.some((text) => normalizeText(text).includes(normalizedKeyword));
};

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (value: number) => (value * Math.PI) / 180;
const distanceBetweenMeters = (origin: { lat: number; lng: number }, target: { lat: number; lng: number }) => {
  const deltaLat = toRadians(target.lat - origin.lat);
  const deltaLng = toRadians(target.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(target.lat);

  const sinDeltaLat = Math.sin(deltaLat / 2);
  const sinDeltaLng = Math.sin(deltaLng / 2);

  const hav = sinDeltaLat * sinDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinDeltaLng * sinDeltaLng;
  const clamped = Math.min(1, Math.max(0, hav));
  const c = 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(Math.max(0, 1 - clamped)));
  return EARTH_RADIUS_METERS * c;
};
const hasValidCoords = (place: LocalPlace | null | undefined) => {
  if (!place?.coords) {
    return false;
  }
  const { lat, lng } = place.coords;
  return Number.isFinite(lat) && Number.isFinite(lng);
};

const RADIUS_METERS = 4000;
const RADIUS_MULTIPLIERS = [1, 1.6, 2.3];

export const PlacesProvider: React.FC<{ children: React.ReactNode; defaultCenter: { lat: number; lng: number } }>
  = ({ children, defaultCenter }) => {
  const extra = (Constants.expoConfig?.extra || {}) as any;
  const demoMode = !!extra?.demoMode;
  const [places, setPlaces] = useState<LocalPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const loadDemo = useCallback(async (keyword?: string, center?: { lat: number; lng: number }, radii?: number[]): Promise<LocalPlace[]> => {
    try {
      // @ts-ignore
      const data = require('../data/demo/locals.json') as LocalPlace[];
      let result = data;

      if (keyword) {
        result = result.filter((place) => matchesKeyword(place, keyword));
      }

      if (center) {
        const radiiToUse = Array.isArray(radii) && radii.length > 0 ? radii : [RADIUS_METERS];
        const withDistance = result
          .filter((place) => hasValidCoords(place))
          .map((place) => ({
            place,
            distance: distanceBetweenMeters(center, { lat: place.coords.lat, lng: place.coords.lng }),
          }));
        const withoutCoords = result.filter((place) => !hasValidCoords(place));

        let selected: typeof withDistance | undefined;
        for (const radius of radiiToUse) {
          const candidates = withDistance.filter((entry) => entry.distance <= radius);
          if (candidates.length > 0) {
            selected = candidates;
            break;
          }
        }

        const effectiveSelection = selected ?? withDistance;
        if (effectiveSelection.length > 0) {
          effectiveSelection.sort((a, b) => a.distance - b.distance);
          result = [...effectiveSelection.map((entry) => entry.place), ...withoutCoords];
        } else {
          result = withoutCoords;
        }
      }

      return result;
    } catch (e) {
      console.warn('Failed demo load, ensure bundling of data files.', e);
      return [];
    }
  }, []);

  const refresh = useCallback(async (center?: { lat: number; lng: number }, options?: RefreshOptions) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    const keyword = options?.keyword?.trim();
    const baseRadius = Math.max(500, options?.radiusMeters ?? RADIUS_METERS);
    const candidateRadii = RADIUS_MULTIPLIERS.map((multiplier) => Math.round(baseRadius * multiplier));
    const c = center || defaultCenter;

    try {
      if (demoMode || !isPlacesConfigured) {
        const demoPlaces = await loadDemo(keyword, c, candidateRadii);
        if (requestId !== requestIdRef.current) {
          return;
        }
        setPlaces(demoPlaces);
        return;
      }

      let raw: any[] = [];

      for (const radius of candidateRadii) {
        raw = keyword
          ? await fetchTextSearchPlaces(keyword, c.lat, c.lng, radius)
          : await fetchNearbyPlaces(c.lat, c.lng, radius, 'restaurant');

        if (Array.isArray(raw) && raw.length > 0) {
          break;
        }
      }

      const mapped = (raw || []).map(mapGoogleToLocal);
      const deduped = Array.from(new Map(mapped.map((place) => [place.id, place])).values());
      deduped.sort((a: LocalPlace, b: LocalPlace) => scorePlace(b) - scorePlace(a));
      if (requestId !== requestIdRef.current) {
        return;
      }
      setPlaces(deduped);
    } catch (error) {
      console.warn('Failed to refresh places; loading demo data.', error);
      const demoPlaces = await loadDemo(keyword, c, candidateRadii);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setPlaces(demoPlaces);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [defaultCenter, demoMode, loadDemo]);


  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ places, loading, refresh, setPlaces }), [places, loading, refresh]);
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
};

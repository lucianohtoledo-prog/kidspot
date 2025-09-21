import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
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
}

interface PlacesContextValue {
  places: LocalPlace[];
  loading: boolean;
  refresh: (center?: {lat: number, lng: number}, options?: RefreshOptions) => Promise<void>;
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

const RADIUS_METERS = 4000;

export const PlacesProvider: React.FC<{children: React.ReactNode, defaultCenter: {lat:number,lng:number}}>
  = ({ children, defaultCenter }) => {
  const extra = (Constants.expoConfig?.extra || {}) as any;
  const demoMode = !!extra?.demoMode;
  const [places, setPlaces] = useState<LocalPlace[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDemo = useCallback(async (keyword?: string) => {
    try {
      // @ts-ignore
      const data = require('../data/demo/locals.json') as LocalPlace[];
      if (!keyword) {
        setPlaces(data);
        return;
      }
      const filtered = data.filter((place) => matchesKeyword(place, keyword));
      setPlaces(filtered);
    } catch (e) {
      console.warn('Failed demo load, ensure bundling of data files.', e);
    }
  }, []);

  const refresh = useCallback(async (center?: {lat: number, lng: number}, options?: RefreshOptions) => {
    setLoading(true);
    const keyword = options?.keyword?.trim();
    try {
      if (demoMode || !isPlacesConfigured) {
        await loadDemo(keyword);
        return;
      }

      const c = center || defaultCenter;
      const raw = keyword
        ? await fetchTextSearchPlaces(keyword, c.lat, c.lng, RADIUS_METERS)
        : await fetchNearbyPlaces(c.lat, c.lng, RADIUS_METERS, 'restaurant');

      const mapped = raw.map(mapGoogleToLocal);
      const deduped = Array.from(new Map(mapped.map((place) => [place.id, place])).values());
      deduped.sort((a: LocalPlace, b: LocalPlace) => scorePlace(b) - scorePlace(a));
      setPlaces(deduped);
    } catch (error) {
      console.warn('Failed to refresh places; loading demo data.', error);
      await loadDemo(keyword);
    } finally {
      setLoading(false);
    }
  }, [defaultCenter, demoMode, loadDemo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ places, loading, refresh, setPlaces }), [places, loading, refresh]);
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
};

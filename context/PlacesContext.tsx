import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Constants from 'expo-constants';
import { scorePlace } from '../services/curation';
import { fetchNearbyPlaces, mapGoogleToLocal, isPlacesConfigured } from '../services/places';
import type { LocalPlace } from '../types/models';

interface PlacesContextValue {
  places: LocalPlace[];
  loading: boolean;
  refresh: (center?: {lat: number, lng: number}) => Promise<void>;
  setPlaces: React.Dispatch<React.SetStateAction<LocalPlace[]>>;
}

const PlacesContext = createContext<PlacesContextValue>({} as any);
export const usePlaces = () => useContext(PlacesContext);

export const PlacesProvider: React.FC<{children: React.ReactNode, defaultCenter: {lat:number,lng:number}}>
  = ({ children, defaultCenter }) => {
  const extra = (Constants.expoConfig?.extra || {}) as any;
  const demoMode = !!extra?.demoMode;
  const [places, setPlaces] = useState<LocalPlace[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDemo = async () => {
    // When running in dev, reading static requires import; fallback to require
    try {
      // @ts-ignore
      const data = require('../data/demo/locals.json');
      setPlaces(data);
    } catch (e) {
      console.warn('Failed demo load, ensure bundling of data files.', e);
    }
  };

  const refresh = async (center?: {lat: number, lng: number}) => {
    setLoading(true);
    try {
      if (demoMode || !isPlacesConfigured) {
        await loadDemo();
      } else {
        const c = center || defaultCenter;
        const raw = await fetchNearbyPlaces(c.lat, c.lng, 4000, 'restaurant');
        const mapped = raw.map(mapGoogleToLocal);
        mapped.sort((a: LocalPlace, b: LocalPlace) => scorePlace(b) - scorePlace(a));
        setPlaces(mapped);
      }
    } catch (error) {
      console.warn('Failed to refresh places; loading demo data.', error);
      await loadDemo();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(() => ({ places, loading, refresh, setPlaces }), [places, loading]);
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
};



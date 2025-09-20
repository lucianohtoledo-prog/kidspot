import React, { createContext, useContext, useState } from 'react';
import type { Amenity, Filters } from '../types/models';

interface FiltersContextValue {
  filters: Filters;
  setRadius: (km: number) => void;
  setAge: (age: Filters['childrenAge']) => void;
  toggleAmenity: (a: Amenity) => void;
  setEnvironment: (e: Filters['environment']) => void;
  setCuisine: (list: string[]) => void;
  setOpenNow: (v: boolean) => void;
  setCategory: (v: string | 'all') => void;
}
const FiltersContext = createContext<FiltersContextValue>({} as any);
export const useFilters = () => useContext(FiltersContext);

export const FiltersProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [filters, setFilters] = useState<Filters>({
    radiusKm: 5,
    childrenAge: 'all',
    environment: 'any',
    amenities: [],
    cuisine: [],
    openNow: false,
    category: 'all',
  });

  const setRadius = (km: number) => setFilters(f => ({...f, radiusKm: km}));
  const setAge = (age: Filters['childrenAge']) => setFilters(f => ({...f, childrenAge: age}));
  const toggleAmenity = (a: Amenity) => setFilters(f => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x!==a) : [...f.amenities, a]
  }));
  const setEnvironment = (e: Filters['environment']) => setFilters(f => ({...f, environment: e}));
  const setCuisine = (list: string[]) => setFilters(f => ({...f, cuisine: list}));
  const setOpenNow = (v: boolean) => setFilters(f => ({...f, openNow: v}));
  const setCategory = (v: string | 'all') => setFilters(f => ({...f, category: v}));

  return (
    <FiltersContext.Provider value={{
      filters, setRadius, setAge, toggleAmenity, setEnvironment, setCuisine, setOpenNow, setCategory
    }}>
      {children}
    </FiltersContext.Provider>
  );
};

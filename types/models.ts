export type Role = 'user' | 'partner' | 'admin';

export type Amenity =
  | 'playroom'
  | 'playground'
  | 'monitors'
  | 'changing_table'
  | 'accessibility'
  | 'fenced_area'
  | 'parking'
  | 'pet_friendly'
  | 'kids_menu'
  | 'outdoor'
  | 'indoor'
  | 'mixed';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  city?: string;
  photoURL?: string;
  role: Role;
}

export interface ReviewHighlight {
  id?: string;
  text: string;
  rating?: number;
  createdAt?: number;
}

export interface LocalPlace {
  id: string;
  name: string;
  description?: string;
  categories: string[]; // restaurant, park, mall, playroom, etc.
  coords: { lat: number; lng: number };
  address?: string;
  phone?: string;
  website?: string;
  googlePlaceId?: string;
  googleRating?: number;
  googleUserRatingsTotal?: number;
  kidspotRating?: number;
  openingHours?: string[];
  amenities: Amenity[];
  ageRange?: '0-5' | '5+' | 'all';
  cuisine?: string[]; // when restaurant
  boostedUntil?: number | null; // timestamp for ranking boost (admin feature)
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  photos?: string[];
  reviewSnippets?: string[];
  reviewHighlights?: ReviewHighlight[];
}

export interface Review {
  id: string;
  userId: string;
  placeId: string;
  createdAt: number;
  ratings: {
    structure: number; // brinquedoteca, parquinho, etc.
    hygiene: number;
    familyService: number;
    safety: number;
    value: number; // custo-benefício
  };
  comment?: string;
  flagged?: boolean;
  status?: 'visible' | 'hidden';
}

export interface EventItem {
  id: string;
  placeId: string;
  title: string;
  description?: string;
  date: string; // ISO date
  time?: string; // HH:mm
  category?: string; // teatrinho, oficina, etc.
  minAge?: number;
  maxAge?: number;
  price?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
}

export interface Favorite {
  id: string;
  userId: string;
  placeId: string;
  createdAt: number;
}

export interface Filters {
  radiusKm: number;
  childrenAge: '0-5' | '5+' | 'all';
  environment: 'indoor' | 'outdoor' | 'mixed' | 'any';
  amenities: Amenity[];
  cuisine: string[];
  openNow: boolean;
  category: string | 'all';
}

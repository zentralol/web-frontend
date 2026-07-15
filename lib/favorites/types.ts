export type FavoritePlaceSource = "attraction" | "google" | "coordinate";

export type FavoritePlaceInput = {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
  attractionId?: number;
  category?: string;
  neighborhood?: string;
};

export type ParsedFavoritePlaceInput = FavoritePlaceInput & {
  source: FavoritePlaceSource;
  sourcePlaceId: string | null;
  placeKey: string;
};

export type FavoritePlaceRow = {
  id: string;
  user_id: string;
  place_key: string;
  source: FavoritePlaceSource;
  source_place_id: string | null;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: string | null;
  neighborhood: string | null;
  created_at: string;
};

export type FavoritePlace = {
  id: string;
  placeKey: string;
  source: FavoritePlaceSource;
  sourcePlaceId: string | null;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  category: string | null;
  neighborhood: string | null;
  createdAt: string;
};

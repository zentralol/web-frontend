export type SelectedLocation = {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  placeId?: string;
};

export type LocationSelectionState =
  | { status: "idle" }
  | { status: "loading"; lat: number; lng: number }
  | { status: "ready"; location: SelectedLocation }
  | { status: "error"; message: string; lat?: number; lng?: number };

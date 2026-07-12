import type {
  PlaceCardItem,
  PlaceCardsData,
} from "@/lib/assistant/agentStreamAdapter";

/** The set of place-card sources that a saved itinerary can originate from. */
export type ItinerarySource = PlaceCardsData["source"];

/** Row shape as stored in the `saved_itineraries` Supabase table (snake_case). */
export type SavedItineraryRow = {
  id: string;
  user_id: string;
  conversation_id: string | null;
  title: string;
  source: ItinerarySource;
  items: PlaceCardItem[];
  description: string | null;
  note: string | null;
  target_time: string | null;
  created_at: string;
  deleted_at: string | null;
};

/** App-facing model for a saved itinerary (camelCase). */
export type SavedItinerary = {
  id: string;
  title: string;
  source: ItinerarySource;
  items: PlaceCardItem[];
  description: string | null;
  note: string | null;
  targetTime: string | null;
  conversationId: string | null;
  createdAt: string;
};

/** Payload accepted by the save action before validation. */
export type SaveItineraryInput = {
  source: ItinerarySource;
  items: PlaceCardItem[];
  description?: string;
  title?: string;
  targetTime?: string | null;
  conversationId?: string | null;
};

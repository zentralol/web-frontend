import type { FavoritePlace } from "@/lib/favorites/types";
import type { SavedItinerary } from "@/lib/itineraries/types";
import type { ConversationRow, ConversationSummary } from "@/lib/assistant/types";
import { DEMO_CONVERSATION_ID } from "@/lib/demo/mode";

export const DEMO_FAVORITES: FavoritePlace[] = [
  {
    id: "demo-fav-1",
    placeKey: "attraction:3",
    source: "attraction",
    sourcePlaceId: "3",
    name: "Washington Square Park",
    address: "Washington Square, New York, NY",
    lat: 40.7308,
    lng: -73.9973,
    category: "Park",
    neighborhood: "Greenwich Village",
    note: "Great for a quiet afternoon sit.",
    createdAt: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "demo-fav-2",
    placeKey: "attraction:4",
    source: "attraction",
    sourcePlaceId: "4",
    name: "High Line",
    address: "10th Ave, New York, NY",
    lat: 40.748,
    lng: -74.0048,
    category: "Park",
    neighborhood: "Chelsea",
    note: null,
    createdAt: "2026-07-21T09:30:00.000Z",
  },
];

export const DEMO_ITINERARIES: SavedItinerary[] = [
  {
    id: "demo-itinerary-1",
    title: "Relaxed Village afternoon",
    source: "itinerary",
    items: [
      {
        candidateId: "demo-place-wsp",
        rank: 1,
        reason: "Start under the arch",
        name: "Washington Square Park",
        lat: 40.7308,
        lng: -73.9973,
        subtitle: "Greenwich Village",
        detail: "Open lawns and people-watching.",
      },
      {
        candidateId: "demo-place-coffee",
        rank: 2,
        reason: "Nearby cafe stop",
        name: "Caffe Reggio",
        lat: 40.7302,
        lng: -74.0003,
        subtitle: "MacDougal Street",
        detail: "Classic Village espresso.",
      },
    ],
    description: "A low-key loop through Greenwich Village.",
    note: "Demo saved trip",
    targetTime: null,
    conversationId: DEMO_CONVERSATION_ID,
    createdAt: "2026-07-22T16:00:00.000Z",
  },
];

export const DEMO_CONVERSATION_SUMMARY: ConversationSummary = {
  id: DEMO_CONVERSATION_ID,
  title: "Demo conversation",
  updatedAt: "2026-07-24T12:00:00.000Z",
};

export function demoConversationRow(userId: string): ConversationRow {
  return {
    id: DEMO_CONVERSATION_ID,
    user_id: userId,
    title: "Demo conversation",
    model: "demo",
    created_at: "2026-07-24T12:00:00.000Z",
    updated_at: "2026-07-24T12:00:00.000Z",
    deleted_at: null,
  };
}

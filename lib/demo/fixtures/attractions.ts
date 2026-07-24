import { attachCrowdToAttractions } from "@/lib/attractions/mappers";
import type {
  Attraction,
  AttractionPredictionRow,
} from "@/lib/attractions/types";
import snapshot from "./attractions.json";

type AttractionSnapshot = {
  id: number;
  name: string;
  category: string;
  neighborhood: string;
  description: string;
  lat: number;
  lng: number;
};

type PredictionSnapshot = {
  attraction_id: number;
  crowd_score: number | null;
  crowd_level: string | null;
  predicted_for: string;
};

const attractionRows = snapshot.attractions as AttractionSnapshot[];
const predictionRows = snapshot.predictions as PredictionSnapshot[];

const baseAttractions: Attraction[] = attractionRows.map((row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  neighborhood: row.neighborhood,
  description: row.description,
  lat: row.lat,
  lng: row.lng,
}));

export const DEMO_ATTRACTION_PREDICTIONS: AttractionPredictionRow[] =
  predictionRows.map((row) => ({
    attraction_id: row.attraction_id,
    crowd_score: row.crowd_score,
    crowd_level: row.crowd_level,
    predicted_for: row.predicted_for,
  }));

/** Full attractions catalog exported from Supabase for demo mode. */
export const DEMO_ATTRACTIONS: Attraction[] = attachCrowdToAttractions(
  baseAttractions,
  DEMO_ATTRACTION_PREDICTIONS,
);

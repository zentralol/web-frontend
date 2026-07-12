export type AttractionRow = {
  id: number;
  Name: string;
  Category: string;
  Neighborhood: string;
  Description: string;
  lat: number;
  lon: number;
};

import type { CrowdLevel } from "./crowdLevels";

export type AttractionPredictionRow = {
  attraction_id: number;
  crowd_score: number | null;
  crowd_level: string | null;
  predicted_for: string;
};

export type AttractionCrowd = {
  score: number;
  level: CrowdLevel;
  predictedFor: string;
};

export type Attraction = {
  id: number;
  name: string;
  category: string;
  neighborhood: string;
  description: string;
  lat: number;
  lng: number;
  crowd?: AttractionCrowd;
};

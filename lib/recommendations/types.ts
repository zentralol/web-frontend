export type QuieterAreaRecommendation = {
  type: "quieter_area";
  h3Cell: string;
  coordinates: { lat: number; lng: number };
  busynessScore: number;
  busynessLevel: string;
  pedestriansPredicted: number | null;
  period: string;
  reason: string;
};

export type RecommendationsRequest = {
  lat: number;
  lng: number;
  targetTime: string;
  limit?: number;
};

export type RecommendationsResponse = {
  targetTime: string;
  recommendations: QuieterAreaRecommendation[];
};

export type QuietTime = {
  targetTime: string;
  busynessScore: number;
  busynessLevel: string;
  confidence: number;
  reason: string;
};

export type QuietTimesRequest = {
  lat: number;
  lng: number;
  targetTime: string;
  startTime: string;
  endTime: string;
  limit?: number;
};

export type QuietTimesResponse = {
  original: {
    targetTime: string;
    busynessScore: number;
    busynessLevel: string;
  };
  quietTimes: QuietTime[];
};

export type HeatmapPredictionRow = {
  h3_cell: string;
  lat: number;
  lon: number;
  period: string | null;
  target_time: string;
  crowd_score: number;
  crowd_level: string;
  pedestrians_pred: number | null;
  crowd_category: string | null;
  source: string;
};

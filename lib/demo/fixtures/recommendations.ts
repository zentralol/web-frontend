export function demoQuieterAreasResponse(targetTime: string) {
  return {
    success: true,
    data: {
      targetTime,
      recommendations: [
        {
          type: "quieter_area",
          h3Cell: "892a100d657ffff",
          coordinates: { lat: 40.7265, lng: -74.002 },
          busynessScore: 0.28,
          busynessLevel: "quiet",
          pedestriansPredicted: 42,
          period: "hour",
          reason: "Residential Village side streets stay calmer than Broadway.",
        },
        {
          type: "quieter_area",
          h3Cell: "892a100d64bffff",
          coordinates: { lat: 40.7359, lng: -74.0027 },
          busynessScore: 0.31,
          busynessLevel: "quiet",
          pedestriansPredicted: 55,
          period: "hour",
          reason: "West Village lanes typically quieter than Union Square.",
        },
        {
          type: "quieter_area",
          h3Cell: "892a1072cdbffff",
          coordinates: { lat: 40.7813, lng: -73.974 },
          busynessScore: 0.36,
          busynessLevel: "quiet",
          pedestriansPredicted: 70,
          period: "hour",
          reason: "Museum campus edges are calmer than Fifth Avenue.",
        },
      ],
    },
  };
}

export function demoQuietTimesResponse(targetTime: string) {
  return {
    success: true,
    data: {
      original: {
        targetTime,
        busynessScore: 0.74,
        busynessLevel: "busy",
      },
      quietTimes: [
        {
          targetTime: targetTime.replace(/T\d{2}:/, "T09:"),
          busynessScore: 0.32,
          busynessLevel: "quiet",
          confidence: 0.88,
          reason: "Mid-morning lull before lunch crowds build.",
        },
        {
          targetTime: targetTime.replace(/T\d{2}:/, "T15:"),
          busynessScore: 0.38,
          busynessLevel: "quiet",
          confidence: 0.84,
          reason: "Afternoon gap between lunch and evening rush.",
        },
        {
          targetTime: targetTime.replace(/T\d{2}:/, "T21:"),
          busynessScore: 0.29,
          busynessLevel: "very_quiet",
          confidence: 0.8,
          reason: "Evening wind-down after dinner peak.",
        },
      ],
    },
  };
}

import type { ZentraEvent } from "@/lib/assistant/agentStreamAdapter";

export const DEMO_SUGGESTED_QUESTIONS = [
  "Plan a relaxed day in Greenwich Village",
  "Where in Manhattan can I avoid crowds tonight?",
  "Budget-friendly lunch spots near Central Park",
  "Accessible museums on the Upper West Side",
] as const;

export type DemoAssistantScript = {
  text: string;
  recommendations?: ZentraEvent;
  tools?: string[];
};

const villagePlaces = {
  source: "itinerary",
  summary: "A relaxed Greenwich Village day with room to wander.",
  items: [
    {
      candidate_id: "demo-wsp",
      rank: 1,
      reason: "Start outdoors",
      name: "Washington Square Park",
      lat: 40.7308,
      lng: -73.9973,
      subtitle: "Greenwich Village",
      detail: "Arch views and shaded benches.",
    },
    {
      candidate_id: "demo-reggio",
      rank: 2,
      reason: "Cafe pause",
      name: "Caffe Reggio",
      lat: 40.7302,
      lng: -74.0003,
      subtitle: "MacDougal Street",
      detail: "Historic espresso stop.",
    },
    {
      candidate_id: "demo-jefferson",
      rank: 3,
      reason: "Quiet walk",
      name: "Jefferson Market Garden",
      lat: 40.7346,
      lng: -73.999,
      subtitle: "West Village",
      detail: "Small garden for a soft landing.",
    },
  ],
};

const quietTonightPlaces = {
  source: "recommend",
  summary: "Quieter pockets if you want to skip the busiest corridors tonight.",
  items: [
    {
      candidate_id: "demo-riverside",
      rank: 1,
      reason: "Calmer waterfront",
      name: "Riverside Park South",
      lat: 40.7772,
      lng: -73.9897,
      subtitle: "Upper West Side",
      detail: "Usually quieter than Midtown after dark.",
    },
    {
      candidate_id: "demo-carlschurz",
      rank: 2,
      reason: "East Side calm",
      name: "Carl Schurz Park",
      lat: 40.7751,
      lng: -73.9434,
      subtitle: "Yorkville",
      detail: "Residential park with softer evening foot traffic.",
    },
  ],
};

const lunchPlaces = {
  source: "nearby",
  summary: "Wallet-friendly lunch options within a short walk of the park.",
  items: [
    {
      candidate_id: "demo-smorgasburg",
      rank: 1,
      reason: "Casual bites",
      name: "Le Pain Quotidien (Columbus Circle)",
      lat: 40.7681,
      lng: -73.9819,
      subtitle: "Near Central Park South",
      detail: "Soups, salads, and bakery staples.",
    },
    {
      candidate_id: "demo-shake",
      rank: 2,
      reason: "Quick and affordable",
      name: "Shake Shack (Columbus Ave)",
      lat: 40.7808,
      lng: -73.9765,
      subtitle: "Upper West Side",
      detail: "Burgers without a Midtown markup.",
    },
    {
      candidate_id: "demo-pixar",
      rank: 3,
      reason: "Market stalls",
      name: "Whole Foods Market Columbus Circle",
      lat: 40.7685,
      lng: -73.9822,
      subtitle: "Time Warner Center",
      detail: "Build-your-own lunch under $15.",
    },
  ],
};

const museumPlaces = {
  source: "attractions",
  summary: "Step-friendly museum stops on the Upper West Side.",
  items: [
    {
      candidate_id: "demo-amnh",
      rank: 1,
      reason: "Elevators and ramps",
      name: "American Museum of Natural History",
      lat: 40.7813,
      lng: -73.974,
      subtitle: "Central Park West",
      detail: "Step-free entrances and elevators between floors.",
    },
    {
      candidate_id: "demo-nye",
      rank: 2,
      reason: "Accessible galleries",
      name: "New-York Historical Society",
      lat: 40.7793,
      lng: -73.974,
      subtitle: "Central Park West",
      detail: "Wheelchair-accessible routes through permanent galleries.",
    },
  ],
};

const PRESET_SCRIPTS: Record<string, DemoAssistantScript> = {
  [DEMO_SUGGESTED_QUESTIONS[0]]: {
    tools: ["get_user_preferences", "submit_recommendations"],
    text:
      "Here is a relaxed Greenwich Village day that keeps walking short and leaves room to linger.\n\n" +
      "Start at **Washington Square Park**, grab a slow coffee nearby, then wander the West Village side streets. " +
      "Finish with a quiet sit at Jefferson Market Garden if you still have energy.\n\n" +
      "I kept the pace soft and the stops close together.",
    recommendations: {
      type: "recommendations",
      data: villagePlaces,
    },
  },
  [DEMO_SUGGESTED_QUESTIONS[1]]: {
    tools: ["get_nearby_places", "submit_recommendations"],
    text:
      "Tonight the busiest corridors are Midtown, Times Square, and the Broadway theater blocks.\n\n" +
      "If you want calmer air, head toward **Riverside Park South** or **Carl Schurz Park** — residential edges with lighter evening foot traffic.\n\n" +
      "Avoid Herald Square and the 42nd Street corridor after 7 PM if crowds are the main concern.",
    recommendations: {
      type: "recommendations",
      data: quietTonightPlaces,
    },
  },
  [DEMO_SUGGESTED_QUESTIONS[2]]: {
    tools: ["get_nearby_places", "submit_recommendations"],
    text:
      "Near Central Park you can eat well without stretching the budget.\n\n" +
      "Look at Columbus Circle for bakery lunches, a classic Shake Shack run on Columbus Avenue, or a build-your-own meal at Whole Foods. " +
      "All are a short walk from the park and usually under $20.",
    recommendations: {
      type: "recommendations",
      data: lunchPlaces,
    },
  },
  [DEMO_SUGGESTED_QUESTIONS[3]]: {
    tools: ["get_user_preferences", "submit_recommendations"],
    text:
      "On the Upper West Side, **American Museum of Natural History** and the **New-York Historical Society** both offer step-free routes and elevators.\n\n" +
      "Enter AMNH via the Columbus Avenue accessible entrance when possible, and budget extra time between halls. " +
      "Both sit on Central Park West with curb cuts and nearby accessible subway elevators.",
    recommendations: {
      type: "recommendations",
      data: museumPlaces,
    },
  },
};

const GENERIC_SCRIPT: DemoAssistantScript = {
  tools: ["get_user_preferences"],
  text:
    "This is a **demo-mode** reply. In live mode I would use your preferences, live crowd data, and maps to answer in detail.\n\n" +
    "Try one of the suggested questions to see a full streamed demo with place cards.",
};

export function getDemoAssistantScript(message: string): DemoAssistantScript {
  const trimmed = message.trim();
  return PRESET_SCRIPTS[trimmed] ?? GENERIC_SCRIPT;
}

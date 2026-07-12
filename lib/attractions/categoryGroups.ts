/** Curated browse groups shown in the map filter UI. */
export const CATEGORY_GROUP_ORDER = [
  "Food & Drink",
  "Museums & Culture",
  "Landmarks & History",
  "Parks & Outdoors",
  "Shopping",
  "Entertainment",
  "Neighborhoods",
  "Transit",
  "Other",
] as const;

export type CategoryGroup = (typeof CATEGORY_GROUP_ORDER)[number];

type GroupRule = {
  group: CategoryGroup;
  keywords: string[];
};

/** First matching rule wins. Keywords are matched against the lowercased raw category. */
const GROUP_RULES: GroupRule[] = [
  {
    group: "Food & Drink",
    keywords: [
      "bakery",
      "bar",
      "pub",
      "deli",
      "restaurant",
      "food hall",
      "market",
      "cafe",
      "dining",
    ],
  },
  {
    group: "Museums & Culture",
    keywords: ["museum", "memorial", "gallery", "university", "cultural"],
  },
  {
    group: "Parks & Outdoors",
    keywords: ["park", "garden", "beach", "trail", "outdoor"],
  },
  {
    group: "Shopping",
    keywords: ["shopping", "retail", "boutique", "mall"],
  },
  {
    group: "Entertainment",
    keywords: [
      "entertainment",
      "sports",
      "stadium",
      "arena",
      "theater",
      "theatre",
      "venue",
    ],
  },
  {
    group: "Transit",
    keywords: [
      "transit",
      "subway",
      "train",
      "station",
      "airport",
      "ferry",
    ],
  },
  {
    group: "Neighborhoods",
    keywords: ["neighborhood"],
  },
  {
    group: "Landmarks & History",
    keywords: [
      "landmark",
      "historic",
      "monument",
      "religious",
      "observation",
      "bridge",
      "heritage",
      "memorial",
      "waterfront",
    ],
  },
];

const DEFAULT_GROUP: CategoryGroup = "Other";

export function resolveCategoryGroup(rawCategory: string): CategoryGroup {
  const normalized = rawCategory.trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_GROUP;
  }

  for (const rule of GROUP_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.group;
    }
  }

  return DEFAULT_GROUP;
}

export function extractCategoryGroups(rawCategories: string[]): CategoryGroup[] {
  const present = new Set<CategoryGroup>();

  for (const category of rawCategories) {
    present.add(resolveCategoryGroup(category));
  }

  return CATEGORY_GROUP_ORDER.filter((group) => present.has(group));
}

/** Browse groups eligible for Top landmarks (scenic / tourist attractions). */
export const SCENIC_ATTRACTION_GROUPS = new Set<CategoryGroup>([
  "Landmarks & History",
  "Museums & Culture",
  "Parks & Outdoors",
  "Entertainment",
]);

export function isScenicAttraction(category: string): boolean {
  return SCENIC_ATTRACTION_GROUPS.has(resolveCategoryGroup(category));
}

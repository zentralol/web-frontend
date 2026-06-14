import type {
  BudgetRange,
  CrowdTolerance,
  DietaryNeed,
  InclusionNeed,
  MobilityNeed,
  TravelInterest,
  TravelPace,
} from "./types";

type Option<T extends string> = { value: T; label: string; description?: string };

export const TRAVEL_PACE_OPTIONS: Option<TravelPace>[] = [
  {
    value: "relaxed",
    label: "Relaxed",
    description: "Take it slow with plenty of downtime",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "A balanced mix of activity and rest",
  },
  {
    value: "packed",
    label: "Packed",
    description: "See and do as much as possible",
  },
];

export const INTEREST_OPTIONS: Option<TravelInterest>[] = [
  { value: "food", label: "Food" },
  { value: "nature", label: "Nature" },
  { value: "history", label: "History" },
  { value: "art", label: "Art" },
  { value: "nightlife", label: "Nightlife" },
  { value: "shopping", label: "Shopping" },
  { value: "architecture", label: "Architecture" },
  { value: "localCulture", label: "Local Culture" },
];

export const BUDGET_RANGE_OPTIONS: Option<BudgetRange>[] = [
  {
    value: "budget",
    label: "Budget",
    description: "Affordable spots and free activities",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Comfortable without splurging",
  },
  {
    value: "premium",
    label: "Premium",
    description: "Top experiences and fine dining",
  },
];

export const CROWD_TOLERANCE_OPTIONS: Option<CrowdTolerance>[] = [
  {
    value: "avoid",
    label: "Avoid crowds",
    description: "Prefer quieter, off-peak experiences",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Some crowds are fine at the right time",
  },
  {
    value: "dontMind",
    label: "Don't mind",
    description: "Happy in busy, popular places",
  },
];

export const MOBILITY_NEED_OPTIONS: Option<MobilityNeed>[] = [
  { value: "wheelchairAccess", label: "Wheelchair access" },
  { value: "stepFree", label: "Step-free routes" },
  { value: "limitedWalking", label: "Limited walking" },
  { value: "frequentBreaks", label: "Frequent breaks" },
  { value: "elevatorAccess", label: "Elevator access" },
];

export const DIETARY_NEED_OPTIONS: Option<DietaryNeed>[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "glutenFree", label: "Gluten-free" },
  { value: "nutAllergy", label: "Nut allergy" },
  { value: "dairyFree", label: "Dairy-free" },
];

export const INCLUSION_NEED_OPTIONS: Option<InclusionNeed>[] = [
  { value: "quietSpaces", label: "Quiet spaces" },
  { value: "sensoryFriendly", label: "Sensory-friendly" },
  { value: "familyFriendly", label: "Family-friendly" },
  { value: "lgbtqSafe", label: "LGBTQ+ safe" },
  { value: "prayerSpaces", label: "Prayer spaces" },
  { value: "englishFriendly", label: "English-friendly" },
  { value: "genderNeutralRestrooms", label: "Gender-neutral restrooms" },
];

export const DEFAULT_PREFERENCE_VALUES = {
  travelPace: "moderate" as TravelPace,
  interests: [] as TravelInterest[],
  budgetRange: "moderate" as BudgetRange,
  crowdTolerance: "moderate" as CrowdTolerance,
  mobilityNeeds: [] as MobilityNeed[],
  dietaryNeeds: [] as DietaryNeed[],
  inclusionNeeds: [] as InclusionNeed[],
};

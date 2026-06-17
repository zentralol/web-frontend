export type TravelPace = "relaxed" | "moderate" | "packed";

export type TravelInterest =
  | "food"
  | "nature"
  | "history"
  | "art"
  | "nightlife"
  | "shopping"
  | "architecture"
  | "localCulture";

export type BudgetRange = "budget" | "moderate" | "premium";

export type CrowdTolerance = "avoid" | "moderate" | "dontMind";

export type MobilityNeed =
  | "wheelchairAccess"
  | "stepFree"
  | "limitedWalking"
  | "frequentBreaks"
  | "elevatorAccess";

export type DietaryNeed =
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "glutenFree"
  | "nutAllergy"
  | "dairyFree";

export type InclusionNeed =
  | "quietSpaces"
  | "sensoryFriendly"
  | "familyFriendly"
  | "lgbtqSafe"
  | "prayerSpaces"
  | "englishFriendly"
  | "genderNeutralRestrooms";

export type UserPreferences = {
  travelPace: TravelPace;
  interests: TravelInterest[];
  budgetRange: BudgetRange;
  crowdTolerance: CrowdTolerance;
  mobilityNeeds: MobilityNeed[];
  dietaryNeeds: DietaryNeed[];
  inclusionNeeds: InclusionNeed[];
  onboardingCompleted: boolean;
};

export type OnboardingPreferencesRow = {
  id: string;
  user_id: string;
  travel_pace: TravelPace;
  interests: string[];
  budget_range: BudgetRange;
  crowd_tolerance: "avoid" | "moderate" | "dont_mind";
  mobility_needs: string[];
  dietary_needs: string[];
  inclusion_needs: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type PreferenceFormValues = Omit<UserPreferences, "onboardingCompleted">;

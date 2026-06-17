import type {
  CrowdTolerance,
  DietaryNeed,
  InclusionNeed,
  MobilityNeed,
  OnboardingPreferencesRow,
  PreferenceFormValues,
  UserPreferences,
} from "./types";
import { preferenceAllowlists } from "./validation";

const crowdToDb: Record<CrowdTolerance, "avoid" | "moderate" | "dont_mind"> = {
  avoid: "avoid",
  moderate: "moderate",
  dontMind: "dont_mind",
};

const crowdFromDb: Record<"avoid" | "moderate" | "dont_mind", CrowdTolerance> = {
  avoid: "avoid",
  moderate: "moderate",
  dont_mind: "dontMind",
};

const mobilitySnakeToCamel: Record<string, MobilityNeed> = {
  wheelchair_access: "wheelchairAccess",
  step_free: "stepFree",
  limited_walking: "limitedWalking",
  frequent_breaks: "frequentBreaks",
  elevator_access: "elevatorAccess",
};

const dietarySnakeToCamel: Record<string, DietaryNeed> = {
  gluten_free: "glutenFree",
  nut_allergy: "nutAllergy",
  dairy_free: "dairyFree",
};

const inclusionSnakeToCamel: Record<string, InclusionNeed> = {
  quiet_spaces: "quietSpaces",
  sensory_friendly: "sensoryFriendly",
  family_friendly: "familyFriendly",
  lgbtq_safe: "lgbtqSafe",
  prayer_spaces: "prayerSpaces",
  english_friendly: "englishFriendly",
  gender_neutral_restrooms: "genderNeutralRestrooms",
};

const validMobilityNeeds = new Set<string>([
  "wheelchairAccess",
  "stepFree",
  "limitedWalking",
  "frequentBreaks",
  "elevatorAccess",
  ...Object.keys(mobilitySnakeToCamel),
]);

const validDietaryNeeds = new Set<string>([
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "glutenFree",
  "nutAllergy",
  "dairyFree",
  ...Object.keys(dietarySnakeToCamel),
]);

const validInclusionNeeds = new Set<string>([
  "quietSpaces",
  "sensoryFriendly",
  "familyFriendly",
  "lgbtqSafe",
  "prayerSpaces",
  "englishFriendly",
  "genderNeutralRestrooms",
  ...Object.keys(inclusionSnakeToCamel),
]);

function sanitizeArray(values: unknown, allowed?: Set<string>): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string" || value.length === 0) {
      continue;
    }

    if (allowed && !allowed.has(value)) {
      continue;
    }

    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

function mapMobilityFromDb(value: string): MobilityNeed | null {
  if (mobilitySnakeToCamel[value]) {
    return mobilitySnakeToCamel[value];
  }
  if (validMobilityNeeds.has(value)) {
    return value as MobilityNeed;
  }
  return null;
}

function mapDietaryFromDb(value: string): DietaryNeed | null {
  if (dietarySnakeToCamel[value]) {
    return dietarySnakeToCamel[value];
  }
  if (validDietaryNeeds.has(value)) {
    return value as DietaryNeed;
  }
  return null;
}

function mapInclusionFromDb(value: string): InclusionNeed | null {
  if (inclusionSnakeToCamel[value]) {
    return inclusionSnakeToCamel[value];
  }
  if (validInclusionNeeds.has(value)) {
    return value as InclusionNeed;
  }
  return null;
}

function mapUnique<T>(values: string[], mapper: (value: string) => T | null): T[] {
  const result: T[] = [];
  const seen = new Set<T>();

  for (const value of values) {
    const mapped = mapper(value);
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      result.push(mapped);
    }
  }

  return result;
}

export function preferencesToRow(
  userId: string,
  values: PreferenceFormValues,
  onboardingCompleted: boolean,
) {
  const crowdTolerance = crowdToDb[values.crowdTolerance];

  if (!crowdTolerance) {
    throw new Error("Invalid preferences");
  }

  return {
    user_id: userId,
    travel_pace: values.travelPace,
    interests: sanitizeArray(
      values.interests,
      preferenceAllowlists.interests,
    ),
    budget_range: values.budgetRange,
    crowd_tolerance: crowdTolerance,
    mobility_needs: sanitizeArray(
      values.mobilityNeeds,
      preferenceAllowlists.mobilityNeeds,
    ),
    dietary_needs: sanitizeArray(
      values.dietaryNeeds,
      preferenceAllowlists.dietaryNeeds,
    ),
    inclusion_needs: sanitizeArray(
      values.inclusionNeeds,
      preferenceAllowlists.inclusionNeeds,
    ),
    onboarding_completed: onboardingCompleted,
    updated_at: new Date().toISOString(),
  };
}

export function rowToPreferences(row: OnboardingPreferencesRow): UserPreferences {
  return {
    travelPace: row.travel_pace,
    interests: sanitizeArray(row.interests) as UserPreferences["interests"],
    budgetRange: row.budget_range,
    crowdTolerance: crowdFromDb[row.crowd_tolerance],
    mobilityNeeds: mapUnique(sanitizeArray(row.mobility_needs), mapMobilityFromDb),
    dietaryNeeds: mapUnique(sanitizeArray(row.dietary_needs), mapDietaryFromDb),
    inclusionNeeds: mapUnique(
      sanitizeArray(row.inclusion_needs),
      mapInclusionFromDb,
    ),
    onboardingCompleted: row.onboarding_completed,
  };
}

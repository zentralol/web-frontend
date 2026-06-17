import {
  BUDGET_RANGE_OPTIONS,
  CROWD_TOLERANCE_OPTIONS,
  DIETARY_NEED_OPTIONS,
  INCLUSION_NEED_OPTIONS,
  INTEREST_OPTIONS,
  MOBILITY_NEED_OPTIONS,
  TRAVEL_PACE_OPTIONS,
} from "./constants";
import type { PreferenceFormValues } from "./types";

const PREFERENCE_FORM_KEYS = new Set([
  "travelPace",
  "interests",
  "budgetRange",
  "crowdTolerance",
  "mobilityNeeds",
  "dietaryNeeds",
  "inclusionNeeds",
]);

const ALLOWED_TRAVEL_PACES = new Set(
  TRAVEL_PACE_OPTIONS.map((option) => option.value),
);
const ALLOWED_INTERESTS = new Set(
  INTEREST_OPTIONS.map((option) => option.value),
);
const ALLOWED_BUDGET_RANGES = new Set(
  BUDGET_RANGE_OPTIONS.map((option) => option.value),
);
const ALLOWED_CROWD_TOLERANCES = new Set(
  CROWD_TOLERANCE_OPTIONS.map((option) => option.value),
);
const ALLOWED_MOBILITY_NEEDS = new Set(
  MOBILITY_NEED_OPTIONS.map((option) => option.value),
);
const ALLOWED_DIETARY_NEEDS = new Set(
  DIETARY_NEED_OPTIONS.map((option) => option.value),
);
const ALLOWED_INCLUSION_NEEDS = new Set(
  INCLUSION_NEED_OPTIONS.map((option) => option.value),
);

export const preferenceAllowlists = {
  travelPace: ALLOWED_TRAVEL_PACES,
  interests: ALLOWED_INTERESTS,
  budgetRange: ALLOWED_BUDGET_RANGES,
  crowdTolerance: ALLOWED_CROWD_TOLERANCES,
  mobilityNeeds: ALLOWED_MOBILITY_NEEDS,
  dietaryNeeds: ALLOWED_DIETARY_NEEDS,
  inclusionNeeds: ALLOWED_INCLUSION_NEEDS,
} as const;

type PreferenceValidationOptions = {
  requireInterests?: boolean;
};

function invalidPreferences(): never {
  throw new Error("Invalid preferences");
}

function assertPlainObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    invalidPreferences();
  }

  return input as Record<string, unknown>;
}

function rejectUnknownKeys(
  object: Record<string, unknown>,
  allowedKeys: Set<string>,
) {
  for (const key of Object.keys(object)) {
    if (!allowedKeys.has(key)) {
      invalidPreferences();
    }
  }
}

function requireEnum<T extends string>(
  value: unknown,
  allowed: Set<T>,
): T {
  if (typeof value !== "string" || !allowed.has(value as T)) {
    invalidPreferences();
  }

  return value as T;
}

function requireStringArray<T extends string>(
  value: unknown,
  allowed: Set<T>,
  options: {
    maxLength: number;
    minLength?: number;
  },
): T[] {
  if (!Array.isArray(value)) {
    invalidPreferences();
  }

  if (value.length > options.maxLength) {
    invalidPreferences();
  }

  if (
    options.minLength !== undefined &&
    value.length < options.minLength
  ) {
    invalidPreferences();
  }

  const result: T[] = [];
  const seen = new Set<T>();

  for (const item of value) {
    if (typeof item !== "string" || !allowed.has(item as T)) {
      invalidPreferences();
    }

    const typedItem = item as T;
    if (seen.has(typedItem)) {
      invalidPreferences();
    }

    seen.add(typedItem);
    result.push(typedItem);
  }

  return result;
}

export function parsePreferenceFormValues(
  input: unknown,
  options: PreferenceValidationOptions = {},
): PreferenceFormValues {
  const object = assertPlainObject(input);
  rejectUnknownKeys(object, PREFERENCE_FORM_KEYS);

  const requireInterests = options.requireInterests ?? true;

  return {
    travelPace: requireEnum(object.travelPace, ALLOWED_TRAVEL_PACES),
    interests: requireStringArray(object.interests, ALLOWED_INTERESTS, {
      maxLength: INTEREST_OPTIONS.length,
      minLength: requireInterests ? 1 : 0,
    }),
    budgetRange: requireEnum(object.budgetRange, ALLOWED_BUDGET_RANGES),
    crowdTolerance: requireEnum(
      object.crowdTolerance,
      ALLOWED_CROWD_TOLERANCES,
    ),
    mobilityNeeds: requireStringArray(
      object.mobilityNeeds,
      ALLOWED_MOBILITY_NEEDS,
      { maxLength: MOBILITY_NEED_OPTIONS.length },
    ),
    dietaryNeeds: requireStringArray(
      object.dietaryNeeds,
      ALLOWED_DIETARY_NEEDS,
      { maxLength: DIETARY_NEED_OPTIONS.length },
    ),
    inclusionNeeds: requireStringArray(
      object.inclusionNeeds,
      ALLOWED_INCLUSION_NEEDS,
      { maxLength: INCLUSION_NEED_OPTIONS.length },
    ),
  };
}

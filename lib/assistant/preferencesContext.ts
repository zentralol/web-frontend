import {
  BUDGET_RANGE_OPTIONS,
  CROWD_TOLERANCE_OPTIONS,
  DIETARY_NEED_OPTIONS,
  INCLUSION_NEED_OPTIONS,
  INTEREST_OPTIONS,
  MOBILITY_NEED_OPTIONS,
  TRAVEL_PACE_OPTIONS,
} from "@/lib/onboarding/constants";
import type { UserPreferences } from "@/lib/onboarding/types";

const BASE_SYSTEM_PROMPT =
  "You are Zentra travel assistant. Help users with city commute and routing questions.";

function labelFor<T extends string>(
  value: T,
  options: Array<{ value: T; label: string }>,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function labelsFor<T extends string>(
  values: T[],
  options: Array<{ value: T; label: string }>,
): string {
  if (values.length === 0) {
    return "None specified";
  }

  return values.map((value) => labelFor(value, options)).join(", ");
}

export function formatPreferencesForPrompt(preferences: UserPreferences): string {
  return [
    "- Travel pace: " + labelFor(preferences.travelPace, TRAVEL_PACE_OPTIONS),
    "- Interests: " + labelsFor(preferences.interests, INTEREST_OPTIONS),
    "- Budget: " + labelFor(preferences.budgetRange, BUDGET_RANGE_OPTIONS),
    "- Crowd tolerance: " +
      labelFor(preferences.crowdTolerance, CROWD_TOLERANCE_OPTIONS),
    "- Mobility needs: " +
      labelsFor(preferences.mobilityNeeds, MOBILITY_NEED_OPTIONS),
    "- Dietary needs: " +
      labelsFor(preferences.dietaryNeeds, DIETARY_NEED_OPTIONS),
    "- Inclusion needs: " +
      labelsFor(preferences.inclusionNeeds, INCLUSION_NEED_OPTIONS),
  ].join("\n");
}

export function buildAssistantSystemPrompt(
  preferences: UserPreferences | null,
): string {
  if (!preferences) {
    return BASE_SYSTEM_PROMPT;
  }

  return `${BASE_SYSTEM_PROMPT}

## User travel preferences
${formatPreferencesForPrompt(preferences)}

When answering, tailor route and commute suggestions to these preferences. Mention tradeoffs when a suggestion conflicts with them.`;
}

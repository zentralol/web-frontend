"use client";

import {
  BUDGET_RANGE_OPTIONS,
  CROWD_TOLERANCE_OPTIONS,
  DEFAULT_PREFERENCE_VALUES,
  DIETARY_NEED_OPTIONS,
  INCLUSION_NEED_OPTIONS,
  INTEREST_OPTIONS,
  MOBILITY_NEED_OPTIONS,
  TRAVEL_PACE_OPTIONS,
} from "@/lib/onboarding/constants";
import type { PreferenceFormValues } from "@/lib/onboarding/types";
import {
  MultiSelectChip,
  OptionCard,
  PreferenceSection,
} from "./PreferenceUI";

type PreferenceFormProps = {
  values: PreferenceFormValues;
  onChange: (values: PreferenceFormValues) => void;
  showOptionalNeeds?: boolean;
};

export function PreferenceForm({
  values,
  onChange,
  showOptionalNeeds = true,
}: PreferenceFormProps) {
  function toggleArrayValue<
    K extends keyof Pick<
      PreferenceFormValues,
      "interests" | "mobilityNeeds" | "dietaryNeeds" | "inclusionNeeds"
    >,
  >(
    field: K,
    value: PreferenceFormValues[K][number],
  ) {
    const current = values[field] as PreferenceFormValues[K][number][];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onChange({ ...values, [field]: next });
  }

  return (
    <div className="space-y-10">
      <PreferenceSection
        title="Travel pace"
        description="How do you like to experience a destination?"
      >
        <div className="grid gap-3 md:grid-cols-3">
          {TRAVEL_PACE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              selected={values.travelPace === option.value}
              onSelect={(travelPace) => onChange({ ...values, travelPace })}
            />
          ))}
        </div>
      </PreferenceSection>

      <PreferenceSection
        title="Interests"
        description="Pick at least one. We'll tailor recommendations around these."
      >
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((option) => (
            <MultiSelectChip
              key={option.value}
              value={option.value}
              label={option.label}
              selected={values.interests.includes(option.value)}
              onToggle={(value) => toggleArrayValue("interests", value)}
            />
          ))}
        </div>
      </PreferenceSection>

      <PreferenceSection
        title="Budget"
        description="What kind of spending fits your trips?"
      >
        <div className="grid gap-3 md:grid-cols-3">
          {BUDGET_RANGE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              selected={values.budgetRange === option.value}
              onSelect={(budgetRange) => onChange({ ...values, budgetRange })}
            />
          ))}
        </div>
      </PreferenceSection>

      <PreferenceSection
        title="Crowds"
        description="How do you feel about busy places?"
      >
        <div className="grid gap-3 md:grid-cols-3">
          {CROWD_TOLERANCE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              selected={values.crowdTolerance === option.value}
              onSelect={(crowdTolerance) =>
                onChange({ ...values, crowdTolerance })
              }
            />
          ))}
        </div>
      </PreferenceSection>

      {showOptionalNeeds ? (
        <>
          <PreferenceSection
            title="Mobility"
            description="Optional accessibility preferences."
          >
            <div className="flex flex-wrap gap-2">
              {MOBILITY_NEED_OPTIONS.map((option) => (
                <MultiSelectChip
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selected={values.mobilityNeeds.includes(option.value)}
                  onToggle={(value) => toggleArrayValue("mobilityNeeds", value)}
                />
              ))}
            </div>
          </PreferenceSection>

          <PreferenceSection
            title="Dietary"
            description="Optional dietary preferences."
          >
            <div className="flex flex-wrap gap-2">
              {DIETARY_NEED_OPTIONS.map((option) => (
                <MultiSelectChip
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selected={values.dietaryNeeds.includes(option.value)}
                  onToggle={(value) => toggleArrayValue("dietaryNeeds", value)}
                />
              ))}
            </div>
          </PreferenceSection>

          <PreferenceSection
            title="Inclusion"
            description="Optional inclusion preferences."
          >
            <div className="flex flex-wrap gap-2">
              {INCLUSION_NEED_OPTIONS.map((option) => (
                <MultiSelectChip
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selected={values.inclusionNeeds.includes(option.value)}
                  onToggle={(value) =>
                    toggleArrayValue("inclusionNeeds", value)
                  }
                />
              ))}
            </div>
          </PreferenceSection>
        </>
      ) : null}
    </div>
  );
}

export function createEmptyPreferences(): PreferenceFormValues {
  return { ...DEFAULT_PREFERENCE_VALUES };
}

export function preferencesToFormValues(
  preferences: PreferenceFormValues,
): PreferenceFormValues {
  return {
    travelPace: preferences.travelPace,
    interests: [...preferences.interests],
    budgetRange: preferences.budgetRange,
    crowdTolerance: preferences.crowdTolerance,
    mobilityNeeds: [...preferences.mobilityNeeds],
    dietaryNeeds: [...preferences.dietaryNeeds],
    inclusionNeeds: [...preferences.inclusionNeeds],
  };
}

export function validatePreferenceForm(values: PreferenceFormValues): string | null {
  if (values.interests.length < 1) {
    return "Select at least one interest.";
  }
  return null;
}

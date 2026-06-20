"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { completeOnboardingAction } from "@/lib/onboarding/actions";
import type { PreferenceFormValues } from "@/lib/onboarding/types";
import {
  FormError,
  MultiSelectChip,
  OptionCard,
  PrimaryButton,
  SecondaryButton,
  StepHeader,
  StepProgress,
} from "./PreferenceUI";

const TOTAL_STEPS = 5;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<PreferenceFormValues>({
    ...DEFAULT_PREFERENCE_VALUES,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setValues({ ...values, [field]: next });
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 2 && values.interests.length < 1) {
      return "Pick at least one interest to continue.";
    }
    return null;
  }

  function handleNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setError(null);
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleComplete() {
    const validationError = validateStep(2);
    if (validationError) {
      setError(validationError);
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await completeOnboardingAction(values);
      router.push("/welcome-back");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--header-height))] max-w-3xl flex-col px-4 py-10 sm:px-6">
      <StepProgress step={step} totalSteps={TOTAL_STEPS} />

      <div className="mt-8 flex flex-1 flex-col">
        {step === 1 ? (
          <div className="space-y-8">
            <StepHeader
              step={1}
              totalSteps={TOTAL_STEPS}
              title="How do you like to travel?"
              description="We'll shape your routes and recommendations around your pace."
            />
            <div className="grid gap-3">
              {TRAVEL_PACE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  description={option.description}
                  selected={values.travelPace === option.value}
                  onSelect={(travelPace) => setValues({ ...values, travelPace })}
                />
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            <StepHeader
              step={2}
              totalSteps={TOTAL_STEPS}
              title="What are you into?"
              description="Choose everything that sounds like you. Pick at least one."
            />
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
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-8">
            <StepHeader
              step={3}
              totalSteps={TOTAL_STEPS}
              title="Budget and crowds"
              description="Help us match the right places to your comfort level."
            />
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-3">
                {BUDGET_RANGE_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    description={option.description}
                    selected={values.budgetRange === option.value}
                    onSelect={(budgetRange) =>
                      setValues({ ...values, budgetRange })
                    }
                  />
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {CROWD_TOLERANCE_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    description={option.description}
                    selected={values.crowdTolerance === option.value}
                    onSelect={(crowdTolerance) =>
                      setValues({ ...values, crowdTolerance })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-8">
            <StepHeader
              step={4}
              totalSteps={TOTAL_STEPS}
              title="Anything we should know?"
              description="These are optional. Skip anything that doesn't apply."
            />
            <div className="space-y-8">
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">
                  Mobility
                </h2>
                <div className="flex flex-wrap gap-2">
                  {MOBILITY_NEED_OPTIONS.map((option) => (
                    <MultiSelectChip
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      selected={values.mobilityNeeds.includes(option.value)}
                      onToggle={(value) =>
                        toggleArrayValue("mobilityNeeds", value)
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">
                  Dietary
                </h2>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_NEED_OPTIONS.map((option) => (
                    <MultiSelectChip
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      selected={values.dietaryNeeds.includes(option.value)}
                      onToggle={(value) =>
                        toggleArrayValue("dietaryNeeds", value)
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/60">
                  Inclusion
                </h2>
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
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-8">
            <StepHeader
              step={5}
              totalSteps={TOTAL_STEPS}
              title="You're all set"
              description="Review your preferences. You can change these anytime in settings."
            />
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <SummaryRow
                label="Travel pace"
                value={
                  TRAVEL_PACE_OPTIONS.find((o) => o.value === values.travelPace)
                    ?.label ?? values.travelPace
                }
              />
              <SummaryRow
                label="Interests"
                value={values.interests
                  .map(
                    (interest) =>
                      INTEREST_OPTIONS.find((o) => o.value === interest)?.label,
                  )
                  .join(", ")}
              />
              <SummaryRow
                label="Budget"
                value={
                  BUDGET_RANGE_OPTIONS.find((o) => o.value === values.budgetRange)
                    ?.label ?? values.budgetRange
                }
              />
              <SummaryRow
                label="Crowds"
                value={
                  CROWD_TOLERANCE_OPTIONS.find(
                    (o) => o.value === values.crowdTolerance,
                  )?.label ?? values.crowdTolerance
                }
              />
              {values.mobilityNeeds.length > 0 ? (
                <SummaryRow
                  label="Mobility"
                  value={values.mobilityNeeds
                    .map(
                      (need) =>
                        MOBILITY_NEED_OPTIONS.find((o) => o.value === need)
                          ?.label,
                    )
                    .join(", ")}
                />
              ) : null}
              {values.dietaryNeeds.length > 0 ? (
                <SummaryRow
                  label="Dietary"
                  value={values.dietaryNeeds
                    .map(
                      (need) =>
                        DIETARY_NEED_OPTIONS.find((o) => o.value === need)
                          ?.label,
                    )
                    .join(", ")}
                />
              ) : null}
              {values.inclusionNeeds.length > 0 ? (
                <SummaryRow
                  label="Inclusion"
                  value={values.inclusionNeeds
                    .map(
                      (need) =>
                        INCLUSION_NEED_OPTIONS.find((o) => o.value === need)
                          ?.label,
                    )
                    .join(", ")}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <FormError message={error} />

        <div className="mt-auto flex flex-wrap gap-3 pt-10">
          {step > 1 ? (
            <SecondaryButton onClick={handleBack} disabled={isSubmitting}>
              Back
            </SecondaryButton>
          ) : null}
          {step < TOTAL_STEPS ? (
            <PrimaryButton onClick={handleNext}>Continue</PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Finish setup"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-sm font-medium text-white/45">{label}</span>
      <span className="text-sm text-white/85 sm:max-w-[60%] sm:text-right">
        {value}
      </span>
    </div>
  );
}

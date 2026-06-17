"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePreferencesAction } from "@/lib/onboarding/actions";
import type { PreferenceFormValues } from "@/lib/onboarding/types";
import {
  PreferenceForm,
  preferencesToFormValues,
  validatePreferenceForm,
} from "./PreferenceForm";
import { FormError, PrimaryButton } from "./PreferenceUI";

type SettingsFormProps = {
  initialValues: PreferenceFormValues;
};

export function SettingsForm({ initialValues }: SettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<PreferenceFormValues>(
    preferencesToFormValues(initialValues),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    const validationError = validatePreferenceForm(values);
    if (validationError) {
      setError(validationError);
      setSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await updatePreferencesAction(values);
      setSuccess(true);
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
    <div className="space-y-8">
      <PreferenceForm values={values} onChange={setValues} />
      <FormError message={error} />
      {success ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Preferences saved.
        </p>
      ) : null}
      <PrimaryButton onClick={handleSave} disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save changes"}
      </PrimaryButton>
    </div>
  );
}

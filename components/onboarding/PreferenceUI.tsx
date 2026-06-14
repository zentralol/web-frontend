"use client";

import type { ReactNode } from "react";

type OptionCardProps<T extends string> = {
  value: T;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: (value: T) => void;
};

export function OptionCard<T extends string>({
  value,
  label,
  description,
  selected,
  onSelect,
}: OptionCardProps<T>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${
        selected
          ? "border-accent bg-accent/10 text-accent"
          : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <span className="block text-sm font-semibold tracking-wide">{label}</span>
      {description ? (
        <span className="mt-1 block text-sm text-white/50">{description}</span>
      ) : null}
    </button>
  );
}

type MultiSelectChipProps<T extends string> = {
  value: T;
  label: string;
  selected: boolean;
  onToggle: (value: T) => void;
};

export function MultiSelectChip<T extends string>({
  value,
  label,
  selected,
  onToggle,
}: MultiSelectChipProps<T>) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
        selected
          ? "border-accent bg-accent/15 text-accent"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function PreferenceSection({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-white/50">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type StepHeaderProps = {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
};

export function StepHeader({
  step,
  totalSteps,
  title,
  description,
}: StepHeaderProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
        Step {step} of {totalSteps}
      </p>
      <h1 className="text-3xl font-light tracking-tight text-white">{title}</h1>
      <p className="max-w-xl text-base text-white/55">{description}</p>
    </div>
  );
}

export function StepProgress({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            index < step ? "bg-accent" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </p>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="rounded-full bg-accent px-8 py-3 text-sm font-bold uppercase tracking-widest text-surface transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-white/15 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white/70 transition-all duration-200 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

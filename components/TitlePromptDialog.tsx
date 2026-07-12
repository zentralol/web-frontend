"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";

interface TitlePromptDialogProps {
  open: boolean;
  defaultValue: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface TitlePromptDialogPanelProps {
  defaultValue: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function TitlePromptDialogPanel({
  defaultValue,
  onConfirm,
  onCancel,
  isLoading,
}: TitlePromptDialogPanelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isLoading) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, onCancel]);

  useEffect(() => {
    if (isLoading) return;

    const timer = window.setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

  const trimmedValue = value.trim();
  const canConfirm = trimmedValue.length > 0 && !isLoading;

  const handleSubmit = () => {
    if (!canConfirm) return;
    onConfirm(trimmedValue);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={isLoading ? undefined : onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className={`${spaceGrotesk.className} text-lg font-semibold text-white`}
        >
          Name your trip
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-white/60">
          Give this trip a name you&apos;ll recognize later.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isLoading}
          maxLength={120}
          placeholder="Weekend in Greenwich Village"
          className="mt-4 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-accent/50 focus:outline-none disabled:opacity-50"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canConfirm}
            className={`${spaceGrotesk.className} inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/15 disabled:opacity-50`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Save trip
          </button>
        </div>
      </div>
    </div>
  );
}

export function TitlePromptDialog({
  open,
  defaultValue,
  onConfirm,
  onCancel,
  isLoading = false,
}: TitlePromptDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <TitlePromptDialogPanel
      defaultValue={defaultValue}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isLoading}
    />
  );
}

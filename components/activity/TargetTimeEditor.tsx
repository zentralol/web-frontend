"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Save, X } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { updateItineraryTargetTimeAction } from "@/lib/itineraries/actions";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/itineraries/targetTime";

const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = "idle" | "saving" | "saved";

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: "Save",
  saving: "Saving...",
  saved: "Saved",
};

interface TargetTimeEditorProps {
  itineraryId: string;
  initialTargetTime: string | null;
}

export function TargetTimeEditor({
  itineraryId,
  initialTargetTime,
}: TargetTimeEditorProps) {
  const [value, setValue] = useState(toDatetimeLocalValue(initialTargetTime));
  const [status, setStatus] = useState<SaveStatus>("idle");
  const savedValueRef = useRef(toDatetimeLocalValue(initialTargetTime));

  const saveTargetTime = async (next: string) => {
    setStatus("saving");
    try {
      const parsed = fromDatetimeLocalValue(next);
      await updateItineraryTargetTimeAction(itineraryId, parsed);
      savedValueRef.current = next;
      setStatus("saved");
    } catch {
      setStatus("idle");
    }
  };

  useEffect(() => {
    if (value === savedValueRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      void saveTargetTime(value);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const isSaving = status === "saving";

  const handleClear = () => {
    setValue("");
    if (status === "saved") {
      setStatus("idle");
    }
    void saveTargetTime("");
  };

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <label
        htmlFor={`target-time-${itineraryId}`}
        className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40"
      >
        Target date & time
      </label>
      <input
        id={`target-time-${itineraryId}`}
        type="datetime-local"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (status === "saved") {
            setStatus("idle");
          }
        }}
        className="mt-1.5 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent/50 focus:outline-none [color-scheme:dark]"
      />
      <div className="mt-1.5 flex justify-end gap-2">
        {value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className={`${spaceGrotesk.className} flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-white/70 transition-colors hover:bg-white/10 disabled:cursor-default`}
          >
            <X className="h-3 w-3" aria-hidden />
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => void saveTargetTime(value)}
          disabled={isSaving}
          aria-live="polite"
          className={`${spaceGrotesk.className} flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-default ${
            status === "saved"
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/10"
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : status === "saved" ? (
            <Check className="h-3 w-3" aria-hidden />
          ) : (
            <Save className="h-3 w-3" aria-hidden />
          )}
          {STATUS_LABELS[status]}
        </button>
      </div>
    </div>
  );
}

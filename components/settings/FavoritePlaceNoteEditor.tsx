"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, Save } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { updateFavoritePlaceNoteAction } from "@/lib/favorites/actions";
import { MAX_FAVORITE_NOTE_LENGTH } from "@/lib/favorites/validation";

const AUTOSAVE_DELAY_MS = 800;

type NoteStatus = "idle" | "saving" | "saved" | "error";

const STATUS_LABELS: Record<NoteStatus, string> = {
  idle: "Save",
  saving: "Saving...",
  saved: "Saved",
  error: "Retry",
};

type FavoritePlaceNoteEditorProps = {
  placeKey: string;
  placeName: string;
  initialNote: string | null;
};

export function FavoritePlaceNoteEditor({
  placeKey,
  placeName,
  initialNote,
}: FavoritePlaceNoteEditorProps) {
  const [value, setValue] = useState(initialNote ?? "");
  const [savedValue, setSavedValue] = useState(initialNote ?? "");
  const [status, setStatus] = useState<NoteStatus>("idle");

  const saveNote = useCallback(
    async (next: string) => {
      setStatus("saving");
      try {
        await updateFavoritePlaceNoteAction(placeKey, next);
        setSavedValue(next);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [placeKey],
  );

  useEffect(() => {
    if (value === savedValue) return;

    const timer = window.setTimeout(() => {
      void saveNote(value);
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [value, savedValue, saveNote]);

  const isSaving = status === "saving";

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={`favorite-note-${placeKey}`}
          className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40"
        >
          Your note
        </label>
        <span className="text-[10px] tabular-nums text-white/30">
          {value.length}/{MAX_FAVORITE_NOTE_LENGTH}
        </span>
      </div>
      <textarea
        id={`favorite-note-${placeKey}`}
        aria-label={`Your note for ${placeName}`}
        value={value}
        maxLength={MAX_FAVORITE_NOTE_LENGTH}
        onChange={(event) => {
          setValue(event.target.value);
          if (status !== "idle") setStatus("idle");
        }}
        rows={2}
        placeholder="Add a personal note about this place..."
        className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-accent/50 focus:outline-none"
      />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        {status === "error" ? (
          <p className="flex items-center gap-1 text-[11px] text-red-300">
            <AlertCircle className="h-3 w-3" aria-hidden />
            Could not save note.
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => void saveNote(value)}
          disabled={isSaving || value === savedValue}
          aria-live="polite"
          className={`${spaceGrotesk.className} flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-default disabled:opacity-60 ${
            status === "saved"
              ? "border-accent/30 bg-accent/10 text-accent"
              : status === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200"
                : "border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/10"
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : status === "saved" ? (
            <Check className="h-3 w-3" aria-hidden />
          ) : status === "error" ? (
            <AlertCircle className="h-3 w-3" aria-hidden />
          ) : (
            <Save className="h-3 w-3" aria-hidden />
          )}
          {STATUS_LABELS[status]}
        </button>
      </div>
    </div>
  );
}

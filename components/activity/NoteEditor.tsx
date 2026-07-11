"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { updateItineraryNoteAction } from "@/lib/itineraries/actions";

/** Delay before an edit triggers an automatic save. */
const AUTOSAVE_DELAY_MS = 800;

type NoteStatus = "idle" | "saving" | "saved";

const STATUS_LABELS: Record<NoteStatus, string> = {
  idle: "Save",
  saving: "Saving...",
  saved: "Saved",
};

interface NoteEditorProps {
  itineraryId: string;
  initialNote: string | null;
}

export function NoteEditor({ itineraryId, initialNote }: NoteEditorProps) {
  const [value, setValue] = useState(initialNote ?? "");
  const [status, setStatus] = useState<NoteStatus>("idle");
  // The value most recently persisted to the server.
  const savedValueRef = useRef(initialNote ?? "");

  const saveNote = async (next: string) => {
    setStatus("saving");
    try {
      await updateItineraryNoteAction(itineraryId, next);
      savedValueRef.current = next;
      setStatus("saved");
    } catch {
      // Return to the default "Save" state so the user can retry manually.
      setStatus("idle");
    }
  };

  // Auto-save shortly after the user stops typing (skips unchanged values).
  useEffect(() => {
    if (value === savedValueRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      void saveNote(value);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const isSaving = status === "saving";

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <label
        htmlFor={`note-${itineraryId}`}
        className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40"
      >
        Your note
      </label>
      <textarea
        id={`note-${itineraryId}`}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (status === "saved") {
            setStatus("idle");
          }
        }}
        rows={2}
        placeholder="Add a personal note for this trip..."
        className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-accent/50 focus:outline-none"
      />
      <div className="mt-1.5 flex justify-end">
        <button
          type="button"
          onClick={() => void saveNote(value)}
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

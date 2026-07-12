"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { updateItineraryTitleAction } from "@/lib/itineraries/actions";

const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = "idle" | "saving" | "saved";

interface TitleEditorProps {
  itineraryId: string;
  initialTitle: string;
  onTitleChange?: (title: string) => void;
}

export function TitleEditor({
  itineraryId,
  initialTitle,
  onTitleChange,
}: TitleEditorProps) {
  const [displayTitle, setDisplayTitle] = useState(initialTitle);
  const [value, setValue] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const savedValueRef = useRef(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveTitle = async (next: string) => {
    const trimmed = next.trim();
    if (!trimmed) {
      setValue(savedValueRef.current);
      setDisplayTitle(savedValueRef.current);
      setIsEditing(false);
      return;
    }

    setStatus("saving");
    try {
      await updateItineraryTitleAction(itineraryId, trimmed);
      savedValueRef.current = trimmed;
      setDisplayTitle(trimmed);
      setValue(trimmed);
      onTitleChange?.(trimmed);
      setStatus("saved");
      setIsEditing(false);
    } catch {
      setValue(savedValueRef.current);
      setDisplayTitle(savedValueRef.current);
      setStatus("idle");
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (!isEditing) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing || value.trim() === savedValueRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveTitle(value);
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isEditing]);

  const startEditing = () => {
    setValue(displayTitle);
    setIsEditing(true);
    if (status === "saved") {
      setStatus("idle");
    }
  };

  const handleBlur = () => {
    if (value.trim() === savedValueRef.current) {
      setIsEditing(false);
      return;
    }
    void saveTitle(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveTitle(value);
    }
    if (event.key === "Escape") {
      setValue(savedValueRef.current);
      setIsEditing(false);
    }
  };

  const isSaving = status === "saving";

  return (
    <div className="min-w-0 flex-1">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (status === "saved") {
              setStatus("idle");
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          maxLength={120}
          aria-label="Trip title"
          className={`${spaceGrotesk.className} w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-base font-semibold text-white focus:border-accent/50 focus:outline-none disabled:opacity-50`}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="group flex min-w-0 max-w-full items-center gap-1.5 text-left"
        >
          <span
            className={`${spaceGrotesk.className} truncate text-base font-semibold text-white group-hover:text-accent`}
          >
            {displayTitle}
          </span>
          <Pencil
            className="h-3.5 w-3.5 shrink-0 text-white/35 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </button>
      )}
      {(isSaving || status === "saved") && (
        <div className="mt-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Saving
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-accent" aria-hidden />
              <span className="text-accent">Saved</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

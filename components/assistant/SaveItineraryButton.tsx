"use client";

import { useState } from "react";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { TitlePromptDialog } from "@/components/TitlePromptDialog";
import { saveItineraryAction } from "@/lib/itineraries/actions";
import { deriveItineraryTitle } from "@/lib/itineraries/validation";
import type { PlaceCardsData } from "@/lib/assistant/agentStreamAdapter";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveItineraryButtonProps {
  source: PlaceCardsData["source"];
  items: PlaceCardsData["items"];
  description?: string;
  conversationId?: string | null;
  targetTime?: string | null;
}

const LABELS: Record<SaveStatus, string> = {
  idle: "Save trip",
  saving: "Saving...",
  saved: "Saved to Activity",
  error: "Try again",
};

export function SaveItineraryButton({
  source,
  items,
  description,
  conversationId,
  targetTime,
}: SaveItineraryButtonProps) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [showDialog, setShowDialog] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const isSaved = status === "saved";
  const isSaving = status === "saving";
  const suggestedTitle = deriveItineraryTitle(items);

  const handleOpenDialog = () => {
    if (isSaving || isSaved) return;
    setShowDialog(true);
  };

  const handleConfirmSave = async (title: string) => {
    setStatus("saving");
    try {
      await saveItineraryAction({
        source,
        items,
        description,
        conversationId,
        targetTime,
        title,
      });
      setStatus("saved");
      setShowDialog(false);
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <TitlePromptDialog
        open={showDialog}
        defaultValue={suggestedTitle}
        onConfirm={(title) => void handleConfirmSave(title)}
        onCancel={() => setShowDialog(false)}
        isLoading={isSaving}
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={handleOpenDialog}
          disabled={isSaving || isSaved}
          aria-live="polite"
          className={`${spaceGrotesk.className} flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-default ${
            isSaved
              ? "border-accent/30 bg-accent/10 text-accent"
              : status === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15"
                : "border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/10"
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : isSaved ? (
            <Check className="h-3 w-3" aria-hidden />
          ) : (
            <Bookmark className="h-3 w-3" aria-hidden />
          )}
          {LABELS[status]}
        </button>
      </div>
    </>
  );
}

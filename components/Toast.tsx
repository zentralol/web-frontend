"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";

interface ToastProps {
  message: string;
  open: boolean;
  onClose: () => void;
  durationMs?: number;
  variant?: "success" | "error";
}

export function Toast({
  message,
  open,
  onClose,
  durationMs = 3000,
  variant = "success",
}: ToastProps) {
  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, durationMs]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(var(--viewport-top)+1rem)] z-50 flex justify-center px-4"
    >
      <div
        className={`animate-fade-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border bg-surface px-4 py-3 shadow-lg ${
          variant === "error" ? "border-red-500/30" : "border-accent/25"
        }`}
      >
        {variant === "error" ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-red-300" aria-hidden />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
        )}
        <p className={`${spaceGrotesk.className} min-w-0 flex-1 text-sm font-medium text-white`}>
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-md p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

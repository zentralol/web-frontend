"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocationPanelContent } from "@/components/map/LocationPanelContent";
import type { LocationSelectionState } from "@/lib/map/types";

type Snap = "half" | "full";

const SNAP_HEIGHT_VH: Record<Snap, number> = {
  half: 45,
  full: 88,
};

const DISMISS_THRESHOLD_PX = 80;
const SHEET_TRANSITION = "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), height 0.32s cubic-bezier(0.32, 0.72, 0, 1)";

type LocationBottomSheetProps = {
  selection: LocationSelectionState;
  onDismiss?: () => void;
  onBack?: () => void;
};

export default function LocationBottomSheet({
  selection,
  onDismiss,
  onBack,
}: LocationBottomSheetProps) {
  const [present, setPresent] = useState(false);
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState<Snap>("half");
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const snapAtDragStartRef = useRef<Snap>("half");
  const onDismissRef = useRef(onDismiss);

  const isActive = selection.status !== "idle";

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Mount the sheet (closed) when a selection becomes active. The state updates
  // run inside rAF rather than synchronously in the effect body to avoid a
  // cascading render.
  useEffect(() => {
    if (!isActive || present) return;

    const frame = requestAnimationFrame(() => {
      setPresent(true);
      setSnap("half");
      setDragOffset(0);
      setOpen(false);
    });

    return () => cancelAnimationFrame(frame);
  }, [isActive, present]);

  // Slide the sheet up on the frame after it has mounted closed.
  useEffect(() => {
    if (!isActive || !present || open) return;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true));
    });

    return () => cancelAnimationFrame(frame);
  }, [isActive, present, open]);

  // Slide the sheet down when the selection clears; unmount happens on
  // transition end.
  useEffect(() => {
    if (isActive || !present || !open) return;

    const frame = requestAnimationFrame(() => {
      setOpen(false);
      setDragOffset(0);
    });

    return () => cancelAnimationFrame(frame);
  }, [isActive, present, open]);

  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, [present, open, snap, dragOffset]);

  const closeSheet = useCallback(() => {
    setOpen(false);
    setDragOffset(0);
    setIsDragging(false);
  }, []);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return;
      if (open || !present) return;

      setPresent(false);
      if (isActive) {
        onDismissRef.current?.();
      }
    },
    [open, present, isActive],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!open) return;
      setIsDragging(true);
      dragStartYRef.current = e.clientY;
      snapAtDragStartRef.current = snap;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [open, snap],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const delta = e.clientY - dragStartYRef.current;
      setDragOffset(Math.max(0, delta));
    },
    [isDragging],
  );

  const finishDrag = useCallback(
    (clientY: number) => {
      if (!isDragging) return;

      setIsDragging(false);
      const delta = clientY - dragStartYRef.current;
      const startSnap = snapAtDragStartRef.current;

      if (delta > DISMISS_THRESHOLD_PX) {
        closeSheet();
        return;
      }

      if (delta < -DISMISS_THRESHOLD_PX) {
        setSnap("full");
        setDragOffset(0);
        return;
      }

      if (startSnap === "full" && delta > DISMISS_THRESHOLD_PX / 2) {
        setSnap("half");
        setDragOffset(0);
        return;
      }

      setDragOffset(0);
    },
    [isDragging, closeSheet],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      finishDrag(e.clientY);
    },
    [isDragging, finishDrag],
  );

  if (!present) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      role="dialog"
      aria-label="Location details"
      aria-hidden={!open}
    >
      <div
        className="flex flex-col overflow-hidden rounded-t-2xl border-t border-white/10 bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
        style={{
          height: `${SNAP_HEIGHT_VH[snap]}vh`,
          transform: open ? `translateY(${dragOffset}px)` : "translateY(100%)",
          transition: isDragging ? "none" : SHEET_TRANSITION,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none flex-col items-center px-6 pt-3 pb-2 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <LocationPanelContent selection={selection} onBack={onBack} />
        </div>
      </div>
    </div>
  );
}

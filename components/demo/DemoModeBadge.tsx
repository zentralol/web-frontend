"use client";

import { useSyncExternalStore } from "react";
import {
  getDemoModeClient,
  getDemoModeServerSnapshot,
  subscribeDemoMode,
} from "@/lib/demo/mode";
import { spaceGrotesk } from "@/app/ui/fonts";

export function DemoModeBadge() {
  const enabled = useSyncExternalStore(
    subscribeDemoMode,
    getDemoModeClient,
    getDemoModeServerSnapshot,
  );

  if (!enabled) {
    return null;
  }

  return (
    <span
      className={`${spaceGrotesk.className} hidden rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-accent sm:inline`}
    >
      Demo mode
    </span>
  );
}

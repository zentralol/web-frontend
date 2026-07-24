"use client";

import { useEffect, useState } from "react";
import {
  DEMO_MODE_CHANGE_EVENT,
  getDemoModeClient,
} from "@/lib/demo/mode";
import { spaceGrotesk } from "@/app/ui/fonts";

export function DemoModeBadge() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(getDemoModeClient());

    const sync = () => setEnabled(getDemoModeClient());
    window.addEventListener("focus", sync);
    window.addEventListener(DEMO_MODE_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener(DEMO_MODE_CHANGE_EVENT, sync);
    };
  }, []);

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

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDemoModeClient, setDemoModeClient } from "./mode";

export function useDemoMode() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEnabled(getDemoModeClient());
    setHydrated(true);
  }, []);

  const setDemoMode = useCallback(
    (next: boolean) => {
      setDemoModeClient(next);
      setEnabled(next);
      router.refresh();
    },
    [router],
  );

  return { enabled, hydrated, setDemoMode };
}

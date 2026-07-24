"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  getDemoModeClient,
  getDemoModeServerSnapshot,
  setDemoModeClient,
  subscribeDemoMode,
} from "./mode";

function subscribeHydrated() {
  return () => {};
}

function getHydratedClientSnapshot() {
  return true;
}

function getHydratedServerSnapshot() {
  return false;
}

export function useDemoMode() {
  const router = useRouter();
  const enabled = useSyncExternalStore(
    subscribeDemoMode,
    getDemoModeClient,
    getDemoModeServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeHydrated,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot,
  );

  const setDemoMode = useCallback(
    (next: boolean) => {
      setDemoModeClient(next);
      router.refresh();
    },
    [router],
  );

  return { enabled, hydrated, setDemoMode };
}

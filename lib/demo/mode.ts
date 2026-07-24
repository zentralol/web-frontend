export const DEMO_MODE_COOKIE = "zentra_demo_mode";
export const DEMO_MODE_COOKIE_VALUE = "1";
export const DEMO_MODE_CHANGE_EVENT = "zentra-demo-mode-change";

/** Fixed demo conversation id so assistant routes work without Supabase. */
export const DEMO_CONVERSATION_ID = "demo-conversation-0001";

/** Fixed Manhattan coords used instead of browser geolocation in demo mode. */
export const DEMO_USER_COORDS = { lat: 40.7308, lng: -73.9973 } as const;
export const DEMO_USER_LOCATION_LABEL = "Washington Square Park";

export function isDemoModeFromCookie(
  cookieHeader: string | null | undefined,
): boolean {
  if (!cookieHeader) {
    return false;
  }

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === DEMO_MODE_COOKIE) {
      return rest.join("=") === DEMO_MODE_COOKIE_VALUE;
    }
  }
  return false;
}

/** Browser-only read of the demo cookie. */
export function getDemoModeClient(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return isDemoModeFromCookie(document.cookie);
}

/** SSR / first-paint snapshot — always off to avoid hydration mismatch. */
export function getDemoModeServerSnapshot(): boolean {
  return false;
}

/** Subscribe to demo-mode cookie changes for useSyncExternalStore. */
export function subscribeDemoMode(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const sync = () => onStoreChange();
  window.addEventListener("focus", sync);
  window.addEventListener(DEMO_MODE_CHANGE_EVENT, sync);
  return () => {
    window.removeEventListener("focus", sync);
    window.removeEventListener(DEMO_MODE_CHANGE_EVENT, sync);
  };
}

/** Browser-only write of the demo cookie (1 year when on). */
export function setDemoModeClient(enabled: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  if (enabled) {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${DEMO_MODE_COOKIE}=${DEMO_MODE_COOKIE_VALUE}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = `${DEMO_MODE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }

  window.dispatchEvent(
    new CustomEvent(DEMO_MODE_CHANGE_EVENT, { detail: { enabled } }),
  );
}

/** Server Components / server actions / route handlers via next/headers. */
export async function isDemoMode(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    return store.get(DEMO_MODE_COOKIE)?.value === DEMO_MODE_COOKIE_VALUE;
  } catch {
    // Outside a Next request scope (e.g. unit tests) demo mode is off.
    return false;
  }
}

export const SIDEBAR_REFRESH_DELAYS_MS = [0, 1000, 2500, 5000, 8000] as const;
export const SIDEBAR_SINGLE_REFRESH_DELAYS_MS = [0] as const;

export type SidebarRefreshCallback = () => void | Promise<void>;

// Polling only pays off while a title is still being generated server-side;
// otherwise one immediate refresh is enough to pick up ordering changes.
export function resolveSidebarRefreshDelays(
  waitForTitle: boolean,
): readonly number[] {
  return waitForTitle
    ? SIDEBAR_REFRESH_DELAYS_MS
    : SIDEBAR_SINGLE_REFRESH_DELAYS_MS;
}

export function scheduleSidebarRefresh(
  refresh: SidebarRefreshCallback,
  delaysMs: readonly number[] = SIDEBAR_REFRESH_DELAYS_MS,
): () => void {
  const timeoutIds = delaysMs.map((delay) =>
    setTimeout(() => {
      void refresh();
    }, delay),
  );

  return () => {
    for (const timeoutId of timeoutIds) {
      clearTimeout(timeoutId);
    }
  };
}

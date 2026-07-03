export const SIDEBAR_REFRESH_DELAYS_MS = [0, 1000, 2500, 5000, 8000] as const;

export type SidebarRefreshCallback = () => void | Promise<void>;

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

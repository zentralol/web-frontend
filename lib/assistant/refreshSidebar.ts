export const SIDEBAR_REFRESH_DELAYS_MS = [0, 1000, 2500, 5000] as const;

export function scheduleSidebarRefresh(
  refresh: () => void,
  delaysMs: readonly number[] = SIDEBAR_REFRESH_DELAYS_MS,
): () => void {
  const timeoutIds = delaysMs.map((delay) => setTimeout(refresh, delay));

  return () => {
    for (const timeoutId of timeoutIds) {
      clearTimeout(timeoutId);
    }
  };
}

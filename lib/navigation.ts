export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getOptimisticActiveHref(
  pendingHref: string | null,
  pathname: string,
  href: string,
): boolean {
  if (pendingHref !== null) {
    return pendingHref === href;
  }

  return isActiveRoute(pathname, href);
}

interface PlainMouseEvent {
  button: number;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export function isPlainLeftClick(event: PlainMouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.shiftKey
  );
}

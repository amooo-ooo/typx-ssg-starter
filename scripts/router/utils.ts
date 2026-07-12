/**
 * Checks whether an anchor should be handled by the SPA router.
 */
export function isRoutableLink(
  anchor: HTMLAnchorElement | null,
  event: Event,
): boolean {
  if (!anchor?.href) return false;

  const e = event as MouseEvent;

  /**
   * Hash-only changes on the same page should use native behaviour.
   */
  const isHashOnly =
    anchor.pathname === location.pathname &&
    anchor.search === location.search &&
    anchor.hash.length > 0;

  return (
    anchor.origin === location.origin &&
    !anchor.hasAttribute("download") &&
    anchor.target !== "_blank" &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.shiftKey &&
    !e.altKey &&
    !isHashOnly
  );
}

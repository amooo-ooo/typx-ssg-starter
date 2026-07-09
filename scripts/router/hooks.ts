/**
 * Router lifecycle hooks and event bus.
 */

export interface NavigateContext {
  url: string;
  isCached: boolean;
}
export interface PrefetchContext {
  url: string;
}

export const routerEvents = new EventTarget();

/**
 * Triggered post-navigation (cached or fetched).
 */
export function onNavigate(cb: (ctx: NavigateContext) => void): void {
  routerEvents.addEventListener('navigate', ((e: CustomEvent<NavigateContext>) => {
    cb(e.detail);
  }) as EventListener);
}

/**
 * Triggered on background prefetch start.
 */
export function onPrefetch(cb: (ctx: PrefetchContext) => void): void {
  routerEvents.addEventListener('prefetch', ((e: CustomEvent<PrefetchContext>) => {
    cb(e.detail);
  }) as EventListener);
}

/**
 * Triggered when a parsed page mounts to the DOM.
 */
export function onMount(cb: () => void): void {
  routerEvents.addEventListener('mount', () => cb());
}

export function emitNavigate(ctx: NavigateContext): void {
  routerEvents.dispatchEvent(new CustomEvent('navigate', { detail: ctx }));
}

export function emitPrefetch(ctx: PrefetchContext): void {
  routerEvents.dispatchEvent(new CustomEvent('prefetch', { detail: ctx }));
}

export function emitMount(): void {
  routerEvents.dispatchEvent(new CustomEvent('mount'));
}

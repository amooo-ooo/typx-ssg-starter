import { isRoutableLink } from './utils';
import { emitNavigate, emitPrefetch, emitMount } from './hooks';

export interface RouterOptions {
  container?: string;
}

/**
 * Core SPA router engine.
 */
export class TypxRouter {
  private readonly fetchCache = new Map<string, Promise<string>>();
  private readonly pageCache = new Map<string, HTMLElement>();
  private container: HTMLElement;
  private currentUrl: string;
  private readonly selector: string;

  constructor(options: RouterOptions = {}) {
    this.selector = options.container ?? '#app';

    const el = document.querySelector<HTMLElement>(this.selector);
    if (!el) throw new Error(`Router container '${this.selector}' not found.`);

    this.container = el;
    this.currentUrl = location.href;
  }


  /**
   * Eagerly fetch and cache the HTML for a given URL.
   */
  prefetch(url: string): Promise<string> {
    if (!this.fetchCache.has(url)) {
      emitPrefetch({ url });

      const request = fetch(url, { cache: 'no-cache' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .catch(err => {
          this.fetchCache.delete(url);
          throw err;
        });

      this.fetchCache.set(url, request);
    }
    return this.fetchCache.get(url)!;
  }

  /**
   * Navigate to a URL, swapping the page container.
   */
  async loadPage(url: string, isPopState = false): Promise<void> {
    try {
      let page = this.pageCache.get(url);
      const isCached = !!page;

      if (!page) {
        page = await this.parsePage(url);
        this.pageCache.set(url, page);
      }

      this.swapContainer(page);

      // Inline scripts from DOMParser are inert; clone  into live document so browser executes them.
      if (!isCached) {
        this.activateScripts(page);
        emitMount();
      }

      document.title = page.dataset.title ?? '';

      if (!isPopState) {
        scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }

      emitNavigate({ url, isCached });
    } catch (error) {
      console.error('SPA navigation failed, falling back to full reload.', error);
      location.href = url;
    }
  }

  /**
   * Bind all event listeners and register the initial page.
   */
  mount(): void {
    this.registerCurrentPage();

    document.addEventListener('mouseover', this.onHover);
    document.addEventListener('touchstart', this.onHover, { passive: true });
    document.addEventListener('click', this.onClick as EventListener);

    addEventListener('popstate', () => {
      this.currentUrl = location.href;
      void this.loadPage(this.currentUrl, true);
    });

    addEventListener('hashchange', () => {
      this.currentUrl = location.href;
    });

    emitMount();
    this.registerHMR();
  }


  /**
   * Fetch a URL and extract the page container from the response.
   */
  private async parsePage(url: string): Promise<HTMLElement> {
    const html = await this.prefetch(url);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const page = doc.querySelector<HTMLElement>(this.selector);

    if (!page) {
      throw new Error(`Container '${this.selector}' not found in fetched page.`);
    }

    page.dataset.url = url;
    page.dataset.title = doc.title;
    return page;
  }

  /**
   * Replace the active container with the target element.
   */
  private swapContainer(next: HTMLElement): void {
    if (this.container !== next) {
      this.container.replaceWith(next);
      this.container = next;
    }
  }

  /**
   * Clones script tags to bypass DOMParser execution restrictions.
   */
  private activateScripts(root: HTMLElement): void {
    for (const original of root.querySelectorAll('script')) {
      const clone = document.createElement('script');
      for (const { name, value } of original.attributes) {
        clone.setAttribute(name, value);
      }
      clone.textContent = original.textContent;
      original.replaceWith(clone);
    }
  }

  /**
   * Snapshot the current page into the cache so back-nav is instant.
   */
  private registerCurrentPage(): void {
    const el = document.querySelector<HTMLElement>(this.selector);
    if (!el) return;

    el.dataset.url = this.currentUrl;
    el.dataset.title = document.title;
    this.pageCache.set(this.currentUrl, el);
    this.container = el;
  }

  /**
   * Set up Vite HMR to invalidate caches on file changes.
   */
  private registerHMR(): void {
    if (!import.meta.hot) return;

    import.meta.hot.on('typx:hmr', () => {
      this.fetchCache.clear();
      this.pageCache.clear();
      this.container.innerHTML = '';
      void this.loadPage(location.href, false);
    });
  }


  private onHover = (e: Event): void => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor && isRoutableLink(anchor, e)) {
      void this.prefetch(anchor.href).catch(() => {});
    }
  };

  private onClick = (e: MouseEvent): void => {
    if (e.button !== 0) return;

    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor || !isRoutableLink(anchor, e)) return;

    e.preventDefault();

    const target = anchor.href;
    if (target === this.currentUrl) return;

    this.currentUrl = target;
    history.pushState({}, '', target);
    void this.loadPage(target);
  };
}

import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

const historyKey = () => (window.history.state as { key?: string } | null)?.key;

const entryStorageKey = (key: string) => `doc-scroll:${key}`;
const urlStorageKey = (asPath: string) => `doc-scroll-url:${asPath}`;

/**
 * Restores the window scroll position on back/forward navigation between doc pages.
 * The Next.js pages router does not restore scroll on popstate (the experimental
 * `scrollRestoration` flag is off), so positions are saved on every navigation away
 * and restored when the entry is revisited:
 * - SPA navigations are keyed by Next's history state key;
 * - full page loads get a fallback keyed by URL, because Next regenerates a fresh
 *   history key on every full load. It is only used when the document itself was
 *   loaded through back/forward, so a genuinely new visit still lands at the top.
 * The restore retries over a few frames because the Mermaid diagrams re-mount from
 * their cache one render after the page itself.
 */
export function useDocScrollRestoration() {
  const router = useRouter();
  const isInitialRestoreRef = useRef(true);

  useEffect(() => {
    // Key of the entry currently displayed. On popstate, history.state already points to the
    // target entry when routeChangeStart fires: reading it at save time would store the
    // outgoing page's scroll under the incoming entry's key, corrupting its saved position.
    let currentKey = historyKey();
    const saveScroll = () => {
      const scrollY = String(Math.round(window.scrollY));
      try {
        if (currentKey) {
          window.sessionStorage.setItem(entryStorageKey(currentKey), scrollY);
        }
        window.sessionStorage.setItem(urlStorageKey(router.asPath), scrollY);
      } catch {
        // sessionStorage unavailable: scroll restoration is best-effort
      }
    };
    const trackKey = () => {
      currentKey = historyKey();
    };
    router.events.on('routeChangeStart', saveScroll); // SPA navigation away
    router.events.on('routeChangeComplete', trackKey);
    window.addEventListener('pagehide', saveScroll); // full page load navigation away
    return () => {
      router.events.off('routeChangeStart', saveScroll);
      router.events.off('routeChangeComplete', trackKey);
      window.removeEventListener('pagehide', saveScroll);
    };
  }, [router.events, router.asPath]);

  useEffect(() => {
    const isInitialRestore = isInitialRestoreRef.current;
    isInitialRestoreRef.current = false;
    let saved: string | null = null;
    try {
      const key = historyKey();
      saved = key ? window.sessionStorage.getItem(entryStorageKey(key)) : null;
      if (saved === null && isInitialRestore) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (navigation?.type === 'back_forward') {
          saved = window.sessionStorage.getItem(urlStorageKey(router.asPath));
        }
      }
    } catch {
      return;
    }
    if (saved === null) {
      return; // first visit: let the router scroll to top
    }
    const targetY = Number(saved);
    let attempts = 0;
    let frameId: number;
    const tryRestore = () => {
      // 'instant' bypasses the global `scroll-behavior: smooth`, required for scrollY to be readable synchronously
      window.scrollTo({ behavior: 'instant', top: targetY });
      // retry while the page has not reached its final height (diagrams mounting from cache)
      if (Math.abs(window.scrollY - targetY) > 1 && attempts++ < 20) {
        frameId = requestAnimationFrame(tryRestore);
      }
    };
    tryRestore();
    return () => cancelAnimationFrame(frameId);
  }, [router.asPath]);
}

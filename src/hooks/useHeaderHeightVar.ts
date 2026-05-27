import { useEffect } from 'react';

/**
 * Measures the real height of the page header (`#main-header`) and exposes it as
 * the `--header-height` CSS variable on `<html>`. Lets full-screen content be
 * sized without hardcoded pixels: `h-[calc(100dvh_-_var(--header-height,57px))]`.
 *
 * Updates automatically on any height change (viewport resize, breakpoint,
 * fonts, fullscreen mode). Call once where the header is mounted (SimplePage).
 */
export function useHeaderHeightVar() {
  useEffect(() => {
    const header = document.getElementById('main-header');
    if (!header) {
      return;
    }
    const setVar = () => {
      document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    };
    setVar();
    const observer = new ResizeObserver(setVar);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
}

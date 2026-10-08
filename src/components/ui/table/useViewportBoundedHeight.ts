import { type RefObject, useLayoutEffect, useState } from 'react';

const VIEWPORT_BOTTOM_MARGIN_PX = 16;
const MIN_HEIGHT_PX = 300;

/**
 * Max height so the container ends at the bottom of the viewport when the page is scrolled to the top.
 * The container's document offset is measured at mount, on viewport resize and whenever the layout
 * above it changes (notices, wrapped filters, tab switch...), so callers never hand-compute offsets.
 */
export function useViewportBoundedHeight(containerRef: RefObject<HTMLElement | null>, enabled: boolean): string | undefined {
  const [maxHeight, setMaxHeight] = useState<string>();

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) {
      return;
    }

    const measure = () => {
      const top = Math.round(container.getBoundingClientRect().top + window.scrollY);
      setMaxHeight(`max(${MIN_HEIGHT_PX}px, calc(100dvh - ${top + VIEWPORT_BOTTOM_MARGIN_PX}px))`);
    };
    measure();

    // body: anything above the table changing height; container: becoming visible (tab, drawer)
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(document.body);
    resizeObserver.observe(container);
    window.addEventListener('resize', measure);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, enabled]);

  return maxHeight;
}

import { useAtom } from 'jotai';
import type { ReactNode } from 'react';

import Icon from '@/components/ui/Icon';
import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import cx from '@/utils/cx';

import { legendOpenAtom } from './atoms';
import { MapLegend } from './MapLegend';

/**
 * Slide-in legend drawer anchored to the left of the map. Width is container-
 * query driven: full-width on narrow containers, 345px on `@xl` and up.
 *
 * `children` overrides the default full app legend — used to inject a custom,
 * parameterizable legend (e.g. iframes) while reusing the drawer mechanics.
 */
export function LegendDrawer({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useAtom(legendOpenAtom);
  return (
    <>
      <aside
        // Drawer fills the map area; scroll lives inside each tab panel via
        // `legend-tabs-fill` (see globals.css) so the tab strip stays pinned.
        className={cx(
          // z-20: sits above the search overlay (z-10) so the search slides behind the open drawer.
          'absolute top-0 left-0 z-20 h-full w-full overflow-hidden bg-white shadow-lg transition-transform duration-200 @xl:w-[345px]',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!open}
      >
        {children ?? <MapLegend />}
      </aside>

      <button
        type="button"
        onClick={() => {
          const next = !open;
          trackEvent(`Carto|Légende|${next ? 'Ouvre' : 'Ferme'}`);
          trackPostHogEvent('map:legend_toggle', { is_open: next });
          setOpen(next);
        }}
        aria-label={open ? 'Masquer la légende' : 'Afficher la légende'}
        className={cx(
          // z-30: always above the drawer (z-20) so it stays clickable, including the
          // full-width drawer on narrow viewports.
          'absolute top-1/2 z-30 -translate-y-1/2 h-[140px] w-[30px] flex items-center justify-center bg-(--background-flat-blue-france) hover:bg-(--background-active-blue-france-hover) text-white shadow transition-[left] duration-200',
          // Open: pinned to the drawer's trailing edge — right edge on a full-width
          // narrow drawer, just past the 345px panel on @xl. Closed: at the map's left edge.
          open ? 'right-0 @xl:right-auto @xl:left-[345px]' : 'left-0'
        )}
      >
        <span className="flex rotate-90 items-center gap-2 text-sm whitespace-nowrap">
          <Icon size="sm" name="fr-icon-arrow-right-s-line" rotate={open ? 90 : -90} />
          Légende
          <Icon size="sm" name="fr-icon-arrow-right-s-line" rotate={open ? 90 : -90} />
        </span>
      </button>
    </>
  );
}

import Icon from '@/components/ui/Icon';
import cx from '@/utils/cx';

import { MapLegend } from './MapLegend';

type LegendDrawerProps = {
  /** Open state, controlled by the parent (typically `<Map>`). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Slide-in legend drawer anchored to the left of the map. Fully controlled
 * — the parent owns the `open` state so adjacent overlays (search input,
 * map controls) can adapt their layout when the drawer expands.
 *
 * Width is container-query driven: `w-full` on narrow containers (the drawer
 * blankets the map), `w-80` on `@xl` containers and up (sits beside the rest
 * of the UI). The vertical "Légende" tab toggles the drawer; on narrow
 * containers it is hidden when the drawer is open since the drawer takes the
 * full width — users rely on the in-drawer close button instead.
 */
export function LegendDrawer({ open, onOpenChange }: LegendDrawerProps) {
  return (
    <>
      <aside
        className={cx(
          'absolute top-0 left-0 z-10 h-full w-full overflow-y-auto bg-white shadow-lg transition-transform duration-200 @xl:w-[350px]',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!open}
      >
        <MapLegend />
      </aside>

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label={open ? 'Masquer la légende' : 'Afficher la légende'}
        className={cx(
          'absolute top-1/2 z-10 -translate-y-1/2 h-[140px] w-[30px] flex items-center justify-center bg-(--background-flat-blue-france) hover:bg-(--background-active-blue-france-hover) text-white shadow transition-[left] duration-200',
          open ? 'hidden @xl:flex left-[350px]' : 'flex left-0'
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

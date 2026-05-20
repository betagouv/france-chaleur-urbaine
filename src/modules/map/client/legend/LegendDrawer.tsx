import { useAtom } from 'jotai';

import Icon from '@/components/ui/Icon';
import cx from '@/utils/cx';

import { legendOpenAtom } from './atoms';
import { MapLegend } from './MapLegend';

/**
 * Slide-in legend drawer anchored to the left of the map. Width is container-
 * query driven: full-width on narrow containers, 350px on `@xl` and up.
 */
export function LegendDrawer() {
  const [open, setOpen] = useAtom(legendOpenAtom);
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
        onClick={() => setOpen(!open)}
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

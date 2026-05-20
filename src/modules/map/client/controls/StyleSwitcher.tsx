import { defaultStyles } from '../../shared/config';
import { useMapCanvasController } from '../core/MapCanvasContext';
import { StyleSwitcherControl } from './StyleSwitcherControl';
import { useControl } from './useControl';

/**
 * Base-style selector at top-right (click → dropdown of available styles).
 *
 * Style switch goes through `controller.setStyle(...)` which preserves
 * user-added sources/layers via MapLibre's `transformStyle` — no flicker.
 */
export function StyleSwitcher() {
  const controller = useMapCanvasController();
  useControl(
    () =>
      new StyleSwitcherControl({
        initialStyleId: defaultStyles[0].id,
        onSelect: (style) => controller.setStyle(style.spec),
        styles: defaultStyles,
      }),
    'top-right'
  );
  return null;
}

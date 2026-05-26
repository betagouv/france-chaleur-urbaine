import type { IControl } from 'maplibre-gl';

import { useControl } from './useControl';

/** Bottom-left FCU logo embedded on the map — opt-in branding for iframes. */
class FcuLogoControl implements IControl {
  private container?: HTMLElement;

  onAdd() {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl';
    const image = document.createElement('img');
    image.src = '/logo-fcu.png';
    image.alt = 'France Chaleur Urbaine';
    image.className = 'block h-10 w-auto';
    container.appendChild(image);
    this.container = container;
    return container;
  }

  onRemove() {
    this.container?.remove();
    this.container = undefined;
  }
}

/**
 * FCU logo control, anchored bottom-left above the scale (added after `<ScaleControl>`,
 * which MapLibre stacks above earlier bottom controls). Render it inside `<Map>` where wanted.
 */
export function FcuLogo() {
  useControl(() => new FcuLogoControl(), 'bottom-left');
  return null;
}

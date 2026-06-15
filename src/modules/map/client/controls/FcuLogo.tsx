import type { IControl } from 'maplibre-gl';

import { useControl } from './useControl';

/** Bottom-left FCU + ADEME logos embedded on the map — opt-in branding for iframes. */
class FcuLogoControl implements IControl {
  private container?: HTMLElement;

  onAdd() {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl flex items-center gap-3';

    const ademeImage = document.createElement('img');
    ademeImage.src = '/logo-ADEME.svg';
    ademeImage.alt = 'ADEME';
    ademeImage.className = 'block h-14 w-auto';
    container.appendChild(ademeImage);

    const fcuImage = document.createElement('img');
    fcuImage.src = '/logo-fcu-with-typo-tight.webp';
    fcuImage.alt = 'France Chaleur Urbaine';
    fcuImage.className = 'block h-12 w-auto rounded bg-white/80 px-2 py-1';
    container.appendChild(fcuImage);

    this.container = container;
    // MapLibre prepends bottom controls (insertBefore firstChild), so the last-added one sits on top.
    // Re-append after insertion (next microtask) so the logos stay *below* the scale bar.
    queueMicrotask(() => this.container?.parentElement?.appendChild(this.container));
    return container;
  }

  onRemove() {
    this.container?.remove();
    this.container = undefined;
  }
}

/**
 * FCU + ADEME logos control, anchored bottom-left below the scale bar (forced via DOM re-append
 * in `onAdd`, since MapLibre stacks bottom controls bottom-up). Render it inside `<Map>` where wanted.
 */
export function FcuLogo() {
  useControl(() => new FcuLogoControl(), 'bottom-left');
  return null;
}

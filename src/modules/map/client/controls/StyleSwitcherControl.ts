import type { IControl, Map } from 'maplibre-gl';

import type { MapStyle } from '../../shared/config';

type StyleSwitcherControlOptions = {
  styles: MapStyle[];
  initialStyleId: string;
  /** Called when the user picks a style. Owner is responsible for applying it (typically via the controller). */
  onSelect: (style: MapStyle) => void;
};

/**
 * MapLibre `IControl` implementing a base-style picker.
 *
 * Pure UI: a single button with a layered-pages icon opens a dropdown listing
 * the available styles. On selection, calls `onSelect` — applying the style
 * (and preserving user content via `transformStyle`) is the owner's job.
 *
 * CSS classes (`maplibregl-style-list`, `maplibregl-style-switcher`) come from
 * `./StyleSwitcher.module.css`, imported (side-effect) by the `StyleSwitcher` wrapper.
 */
export class StyleSwitcherControl implements IControl {
  private readonly styles: MapStyle[];
  private readonly onSelect: (style: MapStyle) => void;
  private activeStyleId: string;
  private container?: HTMLElement;
  private listContainer?: HTMLElement;
  private button?: HTMLButtonElement;
  private readonly onDocumentClick = (event: MouseEvent) => {
    if (this.container && !this.container.contains(event.target as Node)) {
      this.closeList();
    }
  };

  constructor({ styles, initialStyleId, onSelect }: StyleSwitcherControlOptions) {
    this.styles = styles;
    this.activeStyleId = initialStyleId;
    this.onSelect = onSelect;
  }

  onAdd(_map: Map): HTMLElement {
    this.container = document.createElement('div');
    this.container.classList.add('maplibregl-ctrl', 'maplibregl-ctrl-group');

    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.title = 'Changer de fond de carte';
    this.button.setAttribute('aria-label', 'Changer de fond de carte');
    this.button.classList.add('maplibregl-ctrl-icon', 'maplibregl-style-switcher');
    this.button.addEventListener('click', this.openList);

    this.listContainer = document.createElement('div');
    this.listContainer.classList.add('maplibregl-style-list');

    for (const style of this.styles) {
      const styleButton = document.createElement('button');
      styleButton.type = 'button';
      styleButton.innerText = style.label;
      if (style.id === this.activeStyleId) {
        styleButton.classList.add('active');
      }
      styleButton.addEventListener('click', () => this.selectStyle(style));
      this.listContainer.appendChild(styleButton);
    }

    document.addEventListener('click', this.onDocumentClick);

    this.container.appendChild(this.button);
    this.container.appendChild(this.listContainer);
    return this.container;
  }

  onRemove(): void {
    document.removeEventListener('click', this.onDocumentClick);
    this.button?.removeEventListener('click', this.openList);
    this.container?.parentNode?.removeChild(this.container);
  }

  private readonly openList = () => {
    if (!this.listContainer || !this.button) {
      return;
    }
    this.listContainer.style.display = 'block';
    this.button.style.display = 'none';
  };

  private closeList() {
    if (!this.listContainer || !this.button) {
      return;
    }
    this.listContainer.style.display = 'none';
    this.button.style.display = 'block';
  }

  private selectStyle(style: MapStyle) {
    this.closeList();
    if (style.id === this.activeStyleId) {
      return;
    }
    this.activeStyleId = style.id;
    this.onSelect(style);
    if (!this.listContainer) {
      return;
    }
    for (const button of Array.from(this.listContainer.querySelectorAll('button'))) {
      button.classList.remove('active');
    }
    const activeButton = Array.from(this.listContainer.querySelectorAll('button')).find((button) => button.innerText === style.label);
    activeButton?.classList.add('active');
  }
}

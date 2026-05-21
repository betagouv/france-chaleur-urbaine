import type { ReactNode } from 'react';

import { MapAccordion } from './MapAccordion';

type LegendAccordionProps = {
  /** Unique id; persists open/closed state via `?accordions=`. */
  id: string;
  label: ReactNode;
  children: ReactNode;
};

/**
 * Simple URL-state accordion used by the legend tabs. Backed by `MapAccordion`
 * (radix-based), not the DSFR styled-components accordion.
 */
export function LegendAccordion({ id, label, children }: LegendAccordionProps) {
  return (
    <MapAccordion label={label} urlStateId={id}>
      {children}
    </MapAccordion>
  );
}

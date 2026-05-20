import type { ReactNode } from 'react';

import { UrlStateAccordion } from '@/components/ui/Accordion';

import { LegendCheckboxCompactContext } from './LegendCheckbox';

type LegendAccordionProps = {
  id: string;
  label: ReactNode;
  children: ReactNode;
};

/**
 * Module-Map wrapper around `UrlStateAccordion`. Two roles:
 * - posts the Tailwind overrides required to retro-fit the DSFR/styled
 *   accordion panel padding (`.fr-collapse--expanded`), localised here rather
 *   than declared globally on the legend `<Tabs>`,
 * - sets `LegendCheckboxCompactContext` to `true` so descendant
 *   `<LegendCheckbox>` render in compact mode (denser padding + smaller height)
 *   without any explicit prop at the call site.
 */
export function LegendAccordion({ id, label, children }: LegendAccordionProps) {
  return (
    <UrlStateAccordion
      id={id}
      label={label}
      small
      className="[&_.fr-collapse--expanded]:pl-3! [&_.fr-collapse--expanded]:pr-0! [&_.fr-collapse--expanded]:py-2!"
    >
      <LegendCheckboxCompactContext.Provider value={true}>{children}</LegendCheckboxCompactContext.Provider>
    </UrlStateAccordion>
  );
}

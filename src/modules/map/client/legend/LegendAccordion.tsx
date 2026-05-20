import type { ReactNode } from 'react';

import { UrlStateAccordion } from '@/components/ui/Accordion';

import { LegendCheckboxCompactContext } from './LegendCheckbox';

type LegendAccordionProps = {
  id: string;
  label: ReactNode;
  children: ReactNode;
};

/**
 * `UrlStateAccordion` wrapper that retrofits the DSFR panel padding and turns
 * on compact mode for descendant `<LegendCheckbox>`.
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

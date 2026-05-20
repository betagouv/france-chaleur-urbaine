import type { ReactNode } from 'react';

import { UrlStateAccordion } from '@/components/ui/Accordion';
import { CheckableAccordion } from '@/components/ui/CheckableAccordion';
import Tooltip from '@/components/ui/Tooltip';

import type { MapConfigurationProperty } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';

type LegendSectionProps = {
  /** Section title (will be rendered next to the optional `icon`). */
  title: NonNullable<ReactNode>;
  /** Unique id used to persist the open/closed state in the URL (`?accordions=`). Only used when `togglePath` is absent. */
  id: string;
  /**
   * When provided, the section header is a `CheckableAccordion` whose checkbox
   * mirrors the boolean at this `MapConfiguration` path. Toggling the checkbox
   * also expands the section (V1's `TrackableCheckableAccordion` pattern).
   *
   * Without `togglePath`, the section is a plain URL-state accordion (no
   * checkbox). Use for grouping containers, e.g. "Outils".
   */
  togglePath?: MapConfigurationProperty<boolean>;
  /**
   * Optional swatch / icon rendered right after the checkbox, before the title.
   * Typically a colored square or line matching the layer's paint color.
   */
  icon?: ReactNode;
  /** Optional tooltip rendered after the title (DSFR Tooltip with `title` prop). */
  tooltip?: ReactNode;
  /** Children rendered inside the section body. */
  children: NonNullable<ReactNode>;
};

// Title classes copied from V1's StyledCheckableAccordion : flex layout with
// gap, extra-small text, normal weight (DSFR default is bold/medium), default-grey
// color to match the rest of the legend. The `!` suffix forces precedence over
// the styled-components rules in `CheckableAccordion` (`& .fr-accordion__title { font-weight: 500 }`).
const titleClasses = 'flex items-start w-full text-sm font-normal! text-(--text-default-grey)! gap-2';

const TOOLTIP_BLUE_ICON = { className: 'text-(--text-action-high-blue-france)' };

/**
 * Standard legend section.
 *
 * - With `togglePath`: `CheckableAccordion` (checkbox + optional swatch + title).
 *   Master toggle for the layer; expand-on-check (V1's `TrackableCheckableAccordion`).
 * - Without `togglePath`: `UrlStateAccordion`. Open/closed state persisted in URL.
 */
export function LegendSection({ id, title, togglePath, icon, tooltip, children }: LegendSectionProps) {
  const { read, toggleLayer } = useMapConfig();

  if (togglePath) {
    const checked = read<boolean>(togglePath);
    return (
      <CheckableAccordion
        small
        classes={{ title: titleClasses }}
        label={
          <>
            {icon}
            <span className="flex-1">{title}</span>
            {tooltip && <Tooltip title={tooltip} iconProps={TOOLTIP_BLUE_ICON} />}
          </>
        }
        checked={checked}
        onCheck={() => toggleLayer(togglePath)}
        expandOnCheck
        showToggle
        defaultExpanded={checked}
      >
        {children}
      </CheckableAccordion>
    );
  }

  return (
    <UrlStateAccordion id={id} label={title} simple>
      {children}
    </UrlStateAccordion>
  );
}

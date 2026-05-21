import type { ReactNode } from 'react';

import cx from '@/utils/cx';

import type { MapConfigurationProperty } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';
import { MapAccordion, MapCheckableAccordion } from './MapAccordion';

type LegendSectionProps = {
  title: NonNullable<ReactNode>;
  /** Unique id; persists open/closed state via `?accordions=`. */
  id: string;
  /** If set, the header is a checkable row bound to this config path. */
  togglePath?: MapConfigurationProperty<boolean>;
  /** Optional swatch / icon between the checkbox and the label. */
  icon?: ReactNode;
  /** Optional tooltip rendered after the title. */
  tooltip?: ReactNode;
  /** Extra classes on the accordion content (merged with the default padding). */
  contentClassName?: string;
  children: NonNullable<ReactNode>;
};

/**
 * Either a checkable accordion (when `togglePath` is set) or a plain
 * url-state accordion. Both share the same radix-based `MapAccordion`
 * primitives — DSFR styled-components are not used here anymore.
 */
export function LegendSection({ id, title, togglePath, icon, tooltip, contentClassName, children }: LegendSectionProps) {
  const { read, toggleLayer } = useMapConfig();

  if (togglePath) {
    const checked = read<boolean>(togglePath);
    return (
      <MapCheckableAccordion
        label={title}
        checked={checked}
        onCheckChange={() => toggleLayer(togglePath)}
        icon={icon}
        tooltip={tooltip}
        urlStateId={id}
        defaultExpanded={checked}
        contentClassName={cx('ml-4', contentClassName)}
      >
        {children}
      </MapCheckableAccordion>
    );
  }

  return (
    <MapAccordion label={title} urlStateId={id}>
      {children}
    </MapAccordion>
  );
}

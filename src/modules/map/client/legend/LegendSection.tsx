import type { ReactNode } from 'react';

import cx from '@/utils/cx';

import type { MapConfigurationProperty } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';
import { MapCheckableAccordion } from './MapAccordion';

type LegendSectionProps = {
  title: NonNullable<ReactNode>;
  /** Unique id; persists open/closed state via `?accordions=` (on `/carte`) or local state elsewhere. */
  id: string;
  /** Config path bound to the checkbox row at the top of the section. */
  togglePath: MapConfigurationProperty<boolean>;
  /** Optional swatch / icon between the checkbox and the label. */
  icon?: ReactNode;
  /** Optional tooltip rendered after the title. */
  tooltip?: ReactNode;
  /** Extra classes on the accordion content (merged with the default padding). */
  contentClassName?: string;
  children: NonNullable<ReactNode>;
};

/**
 * Layer-toggle section header used across the legend tabs. Thin wrapper around
 * `MapCheckableAccordion` that binds the checkbox + accordion ID to a config
 * path on `MapConfiguration`.
 */
export function LegendSection({ id, title, togglePath, icon, tooltip, contentClassName, children }: LegendSectionProps) {
  const { read, toggleLayer } = useMapConfig();
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

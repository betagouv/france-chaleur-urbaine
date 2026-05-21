import { type ReactNode, useId } from 'react';

import Tooltip from '@/components/ui/Tooltip';
import { type LegendTrackingEvent, trackEvent, trackPostHogEvent } from '@/modules/analytics/client';
import cx from '@/utils/cx';

import type { MapConfigurationProperty } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';

type LegendCheckboxProps = {
  /** Path to a boolean on the `MapConfiguration`. */
  path: MapConfigurationProperty<boolean>;
  label: ReactNode;
  /** Optional colored swatch / icon between the checkbox and the label. */
  icon?: ReactNode;
  /** Optional tooltip displayed after the label. */
  tooltip?: ReactNode;
  /** DSFR hint text shown below the label. */
  hintText?: ReactNode;
  /**
   * V1-style tracking event prefix (e.g. `'Carto|Réseaux de chaleur'`). When set, fires Matomo
   * (`<trackingEvent>|Active/Désactive`) and PostHog (`map:layer_toggled` with the human label
   * derived by stripping `Carto|`). When absent, PostHog falls back to `path`, no Matomo.
   */
  trackingEvent?: LegendTrackingEvent;
  className?: string;
};

/** DSFR checkbox bound to a `MapConfiguration` boolean path. */
export function LegendCheckbox({ path, label, icon, tooltip, hintText, trackingEvent, className }: LegendCheckboxProps) {
  const { read, toggleLayer } = useMapConfig();
  const id = useId();
  const checked = read<boolean>(path);

  const handleChange = () => {
    const next = !checked;
    if (trackingEvent) {
      trackEvent(`${trackingEvent}|${next ? 'Active' : 'Désactive'}`);
    }
    trackPostHogEvent('map:layer_toggled', {
      is_enabled: next,
      layer: trackingEvent ? trackingEvent.replace(/^Carto\|/, '') : path,
    });
    toggleLayer(path);
  };

  return (
    <div className={cx('fr-checkbox-group fr-checkbox-group--sm flex items-center mb-0! py-1', className)}>
      <input id={id} type="checkbox" checked={checked} onChange={handleChange} />
      <label htmlFor={id} className="cursor-pointer flex items-start gap-2 w-full mb-0! text-sm font-normal text-(--text-default-grey)">
        {icon}
        <span className="flex-1 mt-1">
          {label}
          {hintText && <span className="block text-xs">{hintText}</span>}
        </span>
        {tooltip && <Tooltip title={tooltip} iconProps={{ className: 'mt-1 text-(--text-action-high-blue-france)' }} />}
      </label>
    </div>
  );
}

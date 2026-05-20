import { createContext, type ReactNode, useContext, useId } from 'react';

import Tooltip from '@/components/ui/Tooltip';
import cx from '@/utils/cx';

import type { MapConfigurationProperty } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';

/** Provider-driven compact mode (denser layout) — used by `<LegendAccordion>`. */
export const LegendCheckboxCompactContext = createContext(false);

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
  className?: string;
};

/** DSFR checkbox bound to a `MapConfiguration` boolean path. */
export function LegendCheckbox({ path, label, icon, tooltip, hintText, className }: LegendCheckboxProps) {
  const { read, toggleLayer } = useMapConfig();
  const compact = useContext(LegendCheckboxCompactContext);
  const id = useId();
  const checked = read<boolean>(path);

  return (
    <div
      className={cx('fr-checkbox-group fr-checkbox-group--sm flex items-center mb-0! py-1', compact ? 'min-h-9' : 'min-h-12', className)}
    >
      <input id={id} type="checkbox" checked={checked} onChange={() => toggleLayer(path)} />
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

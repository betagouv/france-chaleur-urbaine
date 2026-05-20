import type { ReactNode } from 'react';

import RangeFilter, { type RangeFilterProps } from '@/components/form/dsfr/RangeFilter';
import type { Interval } from '@/utils/interval';

import type { MapConfigurationProperty } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';

/** Domain = bounds the slider can range over. Either resolved from another config path, or a static literal. */
type DomainProp = { domainPath: MapConfigurationProperty<Interval>; domain?: never } | { domain: Interval; domainPath?: never };

type LegendIntervalSliderProps = {
  /** Path to an `Interval` on the active `MapConfiguration`. */
  path: MapConfigurationProperty<Interval>;
  label?: ReactNode;
  unit?: string;
  tooltip?: ReactNode;
  /** Non-linear domain mapping (e.g. for `livraisonsAnnuelles`). */
  domainTransform?: RangeFilterProps['domainTransform'];
} & DomainProp;

/** DSFR range slider bound to an `Interval` on the `MapConfiguration`. */
export function LegendIntervalSlider({ path, label, unit, tooltip, domainTransform, ...rest }: LegendIntervalSliderProps) {
  const { read, updateInterval } = useMapConfig();
  const value = read<Interval>(path);
  const domain = rest.domain ?? read<Interval>(rest.domainPath as MapConfigurationProperty<Interval>);

  return (
    <RangeFilter
      small
      value={value}
      domain={domain}
      onChange={updateInterval(path)}
      label={label}
      unit={unit}
      tooltip={tooltip}
      domainTransform={domainTransform}
    />
  );
}

import type { ReactNode } from 'react';

import RangeFilter from '@/components/form/dsfr/RangeFilter';
import type { Interval } from '@/utils/interval';

import type { MapConfigurationProperty } from '../config/map-configuration';
import { useMapConfig } from '../config/useMapConfig';

type DomainProp =
  /** Resolve the domain (min/max bounds) from a `MapConfiguration` path. */
  | { domainPath: MapConfigurationProperty<Interval>; domain?: never }
  /** Pass a static `Interval` literal for the domain. */
  | { domain: Interval; domainPath?: never };

type LegendIntervalSliderProps = {
  /** Path to an `Interval` on the active `MapConfiguration`. */
  path: MapConfigurationProperty<Interval>;
  label?: ReactNode;
  unit?: string;
  tooltip?: ReactNode;
} & DomainProp;

/**
 * DSFR range slider bound to an `Interval` on the `MapConfiguration` by path.
 * The slider's domain is either:
 *  - resolved from another `MapConfiguration` path (`domainPath`) — typically a
 *    `reseauxDeChaleur.limits.<dimension>` fetched at runtime via tRPC;
 *  - or supplied as a static `Interval` literal (`domain`) — for layers whose
 *    bounds are constants.
 */
export function LegendIntervalSlider({ path, label, unit, tooltip, ...rest }: LegendIntervalSliderProps) {
  const { read, updateInterval } = useMapConfig();
  const value = read<Interval>(path);
  const domain = rest.domain ?? read<Interval>(rest.domainPath as MapConfigurationProperty<Interval>);

  const smallLabel = label ? <span className="text-xs">{label}</span> : undefined;
  return (
    <RangeFilter small value={value} domain={domain} onChange={updateInterval(path)} label={smallLabel} unit={unit} tooltip={tooltip} />
  );
}

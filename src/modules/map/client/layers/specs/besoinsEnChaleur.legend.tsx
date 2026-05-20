import type { ReactNode } from 'react';

import Link from '@/components/ui/Link';
import type { LegendInterval } from '@/modules/map/client/core/common';

import { LegendIcon } from '../../legend/LegendIcon';
import { LegendSection } from '../../legend/LegendSection';
import { besoinsEnChaleurIntervals, besoinsEnFroidIntervals } from './besoinsEnChaleur';

const enrezoTooltip = (
  <>
    Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
    <br />
    <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
      Accéder à la méthodologie
    </Link>
  </>
);

/** Shared gradient bar UI used by both Besoins en chaleur and Besoins en froid. */
function GradientBar({ intervals }: { intervals: LegendInterval[] }) {
  const first = intervals[0];
  const last = intervals[intervals.length - 1];
  return (
    <div className="flex flex-col gap-1 pt-2 pl-3 pr-1">
      <div className="flex h-2.5 border border-(--border-default-grey)">
        {intervals.map((interval) => (
          <div
            key={interval.color}
            title={`${interval.min} – ${interval.max}`}
            className="flex-1"
            style={{ backgroundColor: interval.color }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs">
        <span>{first.min}</span>
        <span>{last.max}</span>
      </div>
    </div>
  );
}

function PolygonIconForIntervals({ intervals }: { intervals: LegendInterval[] }): ReactNode {
  // V1 uses the third-from-last color (a lighter colour) for the icon swatch.
  const swatch = intervals[intervals.length - 3].color;
  return <LegendIcon type="polygon" stroke={swatch} fillOpacity={0.7} />;
}

export function BesoinsEnChaleurLegend() {
  return (
    <LegendSection
      id="besoins-chaleur"
      title="Besoins en chaleur"
      togglePath="besoinsEnChaleur"
      icon={<PolygonIconForIntervals intervals={besoinsEnChaleurIntervals} />}
      tooltip={enrezoTooltip}
    >
      <GradientBar intervals={besoinsEnChaleurIntervals} />
    </LegendSection>
  );
}

export function BesoinsEnFroidLegend() {
  return (
    <LegendSection
      id="besoins-froid"
      title="Besoins en froid"
      togglePath="besoinsEnFroid"
      icon={<PolygonIconForIntervals intervals={besoinsEnFroidIntervals} />}
      tooltip={enrezoTooltip}
    >
      <GradientBar intervals={besoinsEnFroidIntervals} />
    </LegendSection>
  );
}

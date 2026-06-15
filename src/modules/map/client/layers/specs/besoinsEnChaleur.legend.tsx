import type { ReactNode } from 'react';

import Link from '@/components/ui/Link';
import type { LegendInterval } from '@/modules/map/client/core/common';

import { GradientBar } from '../../legend/GradientBar';
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

export function BesoinsEnChaleurLegend() {
  return (
    <LegendSection
      id="besoins-chaleur"
      title="Besoins en chaleur"
      togglePath="besoinsEnChaleur"
      trackingEvent="Carto|Besoins en chaleur"
      icon={<PolygonIconForIntervals intervals={besoinsEnChaleurIntervals} />}
      tooltip={enrezoTooltip}
      contentClassName="m-4"
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
      trackingEvent="Carto|Besoins en froid"
      icon={<PolygonIconForIntervals intervals={besoinsEnFroidIntervals} />}
      tooltip={enrezoTooltip}
      contentClassName="m-4"
    >
      <GradientBar intervals={besoinsEnFroidIntervals} />
    </LegendSection>
  );
}

function PolygonIconForIntervals({ intervals }: { intervals: LegendInterval[] }): ReactNode {
  // Uses the third-from-last color (a lighter colour) for the icon swatch.
  const swatch = intervals[intervals.length - 3].color;
  return <LegendIcon type="polygon" stroke={swatch} fillOpacity={0.7} />;
}

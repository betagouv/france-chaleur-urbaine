import Link from '@/components/ui/Link';

import { LegendCheckbox } from '../../../legend/LegendCheckbox';
import { LegendIcon } from '../../../legend/LegendIcon';
import { LegendSection } from '../../../legend/LegendSection';
import {
  installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor,
  installationsGeothermieSurfaceEchangeursOuvertsOpacity,
  installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor,
} from './installationsGeothermieSurface';
import {
  ouvragesGeothermieSurfaceEchangeursOuvertsDeclareeColor,
  ouvragesGeothermieSurfaceEchangeursOuvertsOpacity,
  ouvragesGeothermieSurfaceEchangeursOuvertsRealiseeColor,
} from './ouvragesGeothermieSurface';

/** Géothermie de surface sur échangeurs ouverts (nappe) — toggle + 4 sub. */
export function GeothermieSurfaceEchangeursOuvertsLegend() {
  return (
    <LegendSection
      id="geothermie-surface-ouverts"
      title="Géothermie de surface sur échangeurs ouverts (nappe)"
      togglePath="geothermieSurfaceEchangeursOuverts.show"
      trackingEvent="Carto|Géothermie sur nappe"
      tooltip={
        <>
          Une installation peut être constituée d'un ou plusieurs ouvrages.
          <br />
          Source :{' '}
          <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
            BRGM
          </Link>
        </>
      }
      contentClassName="ml-4"
    >
      <LegendCheckbox
        path="geothermieSurfaceEchangeursOuverts.showInstallationsRealisees"
        trackingEvent="Carto|Installations géothermie sur nappe réalisées"
        label="Installations réalisées"
        icon={
          <LegendIcon
            type="circle"
            color={installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor}
            opacity={installationsGeothermieSurfaceEchangeursOuvertsOpacity}
          />
        }
      />
      <LegendCheckbox
        path="geothermieSurfaceEchangeursOuverts.showInstallationsDeclarees"
        trackingEvent="Carto|Installations géothermie sur nappe déclarées"
        label="Installations déclarées"
        icon={
          <LegendIcon
            type="circle"
            color={installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor}
            opacity={installationsGeothermieSurfaceEchangeursOuvertsOpacity}
          />
        }
      />
      <LegendCheckbox
        path="geothermieSurfaceEchangeursOuverts.showOuvragesRealises"
        trackingEvent="Carto|Ouvrages géothermie sur nappe réalisés"
        label="Ouvrages réalisés"
        icon={
          <LegendIcon
            type="square"
            color={ouvragesGeothermieSurfaceEchangeursOuvertsRealiseeColor}
            opacity={ouvragesGeothermieSurfaceEchangeursOuvertsOpacity}
          />
        }
      />
      <LegendCheckbox
        path="geothermieSurfaceEchangeursOuverts.showOuvragesDeclares"
        trackingEvent="Carto|Ouvrages géothermie sur nappe déclarés"
        label="Ouvrages déclarés"
        icon={
          <LegendIcon
            type="square"
            color={ouvragesGeothermieSurfaceEchangeursOuvertsDeclareeColor}
            opacity={ouvragesGeothermieSurfaceEchangeursOuvertsOpacity}
          />
        }
      />
    </LegendSection>
  );
}

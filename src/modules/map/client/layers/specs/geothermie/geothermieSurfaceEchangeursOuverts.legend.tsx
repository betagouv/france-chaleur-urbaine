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
    >
      <div className="flex flex-col pt-2 pl-3 pr-1">
        <LegendCheckbox
          path="geothermieSurfaceEchangeursOuverts.showInstallationsRealisees"
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
          label="Ouvrages déclarés"
          icon={
            <LegendIcon
              type="square"
              color={ouvragesGeothermieSurfaceEchangeursOuvertsDeclareeColor}
              opacity={ouvragesGeothermieSurfaceEchangeursOuvertsOpacity}
            />
          }
        />
      </div>
    </LegendSection>
  );
}

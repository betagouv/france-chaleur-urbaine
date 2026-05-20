import Link from '@/components/ui/Link';

import { LegendCheckbox } from '../../../legend/LegendCheckbox';
import { LegendIcon } from '../../../legend/LegendIcon';
import { LegendSection } from '../../../legend/LegendSection';
import {
  installationsGeothermieSurfaceEchangeursFermesDeclareeColor,
  installationsGeothermieSurfaceEchangeursFermesOpacity,
  installationsGeothermieSurfaceEchangeursFermesRealiseeColor,
} from './installationsGeothermieSurface';
import {
  ouvragesGeothermieSurfaceEchangeursFermesDeclareeColor,
  ouvragesGeothermieSurfaceEchangeursFermesOpacity,
  ouvragesGeothermieSurfaceEchangeursFermesRealiseeColor,
} from './ouvragesGeothermieSurface';

/** Géothermie de surface sur échangeurs fermés (sonde) — toggle + 4 sub. */
export function GeothermieSurfaceEchangeursFermesLegend() {
  return (
    <LegendSection
      id="geothermie-surface-fermes"
      title="Géothermie de surface sur échangeurs fermés (sonde)"
      togglePath="geothermieSurfaceEchangeursFermes.show"
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
          path="geothermieSurfaceEchangeursFermes.showInstallationsRealisees"
          label="Installations réalisées"
          icon={
            <LegendIcon
              type="circle"
              color={installationsGeothermieSurfaceEchangeursFermesRealiseeColor}
              opacity={installationsGeothermieSurfaceEchangeursFermesOpacity}
            />
          }
        />
        <LegendCheckbox
          path="geothermieSurfaceEchangeursFermes.showInstallationsDeclarees"
          label="Installations déclarées"
          icon={
            <LegendIcon
              type="circle"
              color={installationsGeothermieSurfaceEchangeursFermesDeclareeColor}
              opacity={installationsGeothermieSurfaceEchangeursFermesOpacity}
            />
          }
        />
        <LegendCheckbox
          path="geothermieSurfaceEchangeursFermes.showOuvragesRealises"
          label="Ouvrages réalisés"
          icon={
            <LegendIcon
              type="square"
              color={ouvragesGeothermieSurfaceEchangeursFermesRealiseeColor}
              opacity={ouvragesGeothermieSurfaceEchangeursFermesOpacity}
            />
          }
        />
        <LegendCheckbox
          path="geothermieSurfaceEchangeursFermes.showOuvragesDeclares"
          label="Ouvrages déclarés"
          icon={
            <LegendIcon
              type="square"
              color={ouvragesGeothermieSurfaceEchangeursFermesDeclareeColor}
              opacity={ouvragesGeothermieSurfaceEchangeursFermesOpacity}
            />
          }
        />
      </div>
    </LegendSection>
  );
}

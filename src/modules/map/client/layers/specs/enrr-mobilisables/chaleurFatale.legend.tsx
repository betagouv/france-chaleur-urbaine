import Image from 'next/image';

import Link from '@/components/ui/Link';
import enrrMobilisablesDatacenter from '@/modules/map/client/core/icons/enrr_mobilisables_datacenter.png';
import enrrMobilisablesIndustrie from '@/modules/map/client/core/icons/enrr_mobilisables_industrie.png';
import enrrMobilisablesInstallationsElectrogenes from '@/modules/map/client/core/icons/enrr_mobilisables_installations_electrogenes.png';
import enrrMobilisablesStationsEpuration from '@/modules/map/client/core/icons/enrr_mobilisables_stations_epuration.png';
import enrrMobilisablesUnitesIncineration from '@/modules/map/client/core/icons/enrr_mobilisables_unites_incineration.png';

import { LegendCheckbox } from '../../../legend/LegendCheckbox';
import { LegendSection } from '../../../legend/LegendSection';

const enrezoTooltip = (
  <>
    Données du projet{' '}
    <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" isExternal>
      EnRezo
    </Link>{' '}
    du Cerema.
  </>
);

/** PNG-based icon (16×16) used by each ENR&R "chaleur fatale" sub-feature. */
function PngIcon({ src, alt }: { src: typeof enrrMobilisablesDatacenter; alt: string }) {
  return <Image src={src} alt={alt} width={16} height={16} className="shrink-0" />;
}

export function ChaleurFataleLegend() {
  return (
    <LegendSection id="enrr-chaleur-fatale" title="Chaleur fatale" togglePath="enrrMobilisablesChaleurFatale.show" tooltip={enrezoTooltip}>
      <div className="flex flex-col pt-2 pl-3 pr-1">
        <LegendCheckbox
          path="enrrMobilisablesChaleurFatale.showUnitesDIncineration"
          label="Unités d'incinération"
          icon={<PngIcon src={enrrMobilisablesUnitesIncineration} alt="" />}
        />
        <LegendCheckbox
          path="enrrMobilisablesChaleurFatale.showIndustrie"
          label="Industrie"
          icon={<PngIcon src={enrrMobilisablesIndustrie} alt="" />}
        />
        <LegendCheckbox
          path="enrrMobilisablesChaleurFatale.showStationsDEpuration"
          label="Stations d'épuration"
          icon={<PngIcon src={enrrMobilisablesStationsEpuration} alt="" />}
        />
        <LegendCheckbox
          path="enrrMobilisablesChaleurFatale.showDatacenters"
          label="Datacenters"
          icon={<PngIcon src={enrrMobilisablesDatacenter} alt="" />}
        />
        <LegendCheckbox
          path="enrrMobilisablesChaleurFatale.showInstallationsElectrogenes"
          label="Installations électrogènes"
          icon={<PngIcon src={enrrMobilisablesInstallationsElectrogenes} alt="" />}
        />
      </div>
    </LegendSection>
  );
}

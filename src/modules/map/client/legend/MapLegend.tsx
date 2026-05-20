import Tabs, { type TabsProps } from '@codegouvfr/react-dsfr/Tabs';
import IconEnrr from '@root/public/icons/enrr.svgr';
import IconOutils from '@root/public/icons/outils.svgr';
import IconPotentiel from '@root/public/icons/potentiel.svgr';
import IconReseaux from '@root/public/icons/reseaux.svgr';
import { parseAsString, useQueryState } from 'nuqs';

import CallOut from '@/components/ui/CallOut';
import Divider from '@/components/ui/Divider';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';

import {
  BatimentsRaccordesReseauxChaleurLegend,
  BatimentsRaccordesReseauxFroidLegend,
} from '../layers/specs/batimentsRaccordesReseauxChaleurFroid.legend';
import { CaracteristiquesBatimentsLegend } from '../layers/specs/bdnb/caracteristiquesBatiments.legend';
import { BatimentsFioulCollectifLegend, BatimentsGazCollectifLegend } from '../layers/specs/bdnb/typeChauffageBatimentsCollectifs.legend';
import { BesoinsEnChaleurLegend, BesoinsEnFroidLegend } from '../layers/specs/besoinsEnChaleur.legend';
import { BesoinsEnChaleurIndustrieCommunesLegend } from '../layers/specs/besoinsEnChaleurIndustrieCommunes.legend';
import { CommunesFortPotentielLegend } from '../layers/specs/communesFortPotentielPourCreationReseauxChaleur.legend';
import { ConsommationsGazLegend } from '../layers/specs/consommationsGaz.legend';
import { DemandesEligibiliteLegend } from '../layers/specs/demandesEligibilite.legend';
import { ChaleurFataleLegend } from '../layers/specs/enrr-mobilisables/chaleurFatale.legend';
import { SolaireThermiqueLegend } from '../layers/specs/enrr-mobilisables/solaireThermique.legend';
import { ThalassothermieLegend } from '../layers/specs/enrr-mobilisables/thalassothermie.legend';
import { ZonesGeothermieProfondeLegend } from '../layers/specs/enrr-mobilisables/zonesGeothermieProfonde.legend';
import { EtudesEnCoursLegend } from '../layers/specs/etudesEnCours.legend';
import { GeothermieProfondeLegend } from '../layers/specs/geothermie/geothermieProfonde.legend';
import { GeothermieSurfaceEchangeursFermesLegend } from '../layers/specs/geothermie/geothermieSurfaceEchangeursFermes.legend';
import { GeothermieSurfaceEchangeursOuvertsLegend } from '../layers/specs/geothermie/geothermieSurfaceEchangeursOuverts.legend';
import { PerimetresDeDeveloppementPrioritaireLegend } from '../layers/specs/perimetresDeDeveloppementPrioritaire.legend';
import { QuartiersPrioritairesLegend } from '../layers/specs/quartiersPrioritairesPolitiqueVille.legend';
import { ReseauxDeChaleurLegend } from '../layers/specs/reseauxDeChaleur.legend';
import { ReseauxDeFroidLegend } from '../layers/specs/reseauxDeFroid.legend';
import { ReseauxEnConstructionLegend } from '../layers/specs/reseauxEnConstruction.legend';
import { RessourcesGeothermalesNappesLegend } from '../layers/specs/ressourcesGeothermalesNappes.legend';
import { ZonesAUrbaniserLegend } from '../layers/specs/zonesAUrbaniser.legend';
import { ZonesPotentielChaudLegend } from '../layers/specs/zonesPotentielChaud.legend';
import { ZonesPotentielFroidLegend } from '../layers/specs/zonesPotentielFroid.legend';
import { LegendAccordion } from './LegendAccordion';
import { ToolsTabContent } from './tools/ToolsTabContent';

const tabIds = ['reseaux', 'potentiel', 'enrr', 'outils'] as const;
type TabId = (typeof tabIds)[number];

type Tab = TabsProps.Controlled['tabs'][number] & { tabId: TabId };

const tabs: Tab[] = [
  {
    label: (
      <span className="flex flex-col items-center gap-1 text-xs">
        <IconReseaux height="22" width="22" />
        Réseaux
      </span>
    ),
    tabId: 'reseaux',
  },
  {
    label: (
      <span className="flex flex-col items-center gap-1 text-xs">
        <IconPotentiel height="22" width="22" />
        Potentiel
      </span>
    ),
    tabId: 'potentiel',
  },
  {
    label: (
      <span className="flex flex-col items-center gap-1 text-xs">
        <IconEnrr height="22" width="22" />
        EnR&R
      </span>
    ),
    tabId: 'enrr',
  },
  {
    label: (
      <span className="flex flex-col items-center gap-1 text-xs">
        <IconOutils height="22" width="22" />
        Outils
      </span>
    ),
    tabId: 'outils',
  },
];

/** 4-tab legend layout (Réseaux / Potentiel / EnR&R / Outils). */
export function MapLegend() {
  const [selectedTabId, setSelectedTabId] = useQueryState('tab', parseAsString.withDefault('reseaux').withOptions({ history: 'replace' }));

  return (
    <Tabs
      selectedTabId={selectedTabId}
      tabs={tabs}
      onTabChange={(next) => void setSelectedTabId(next)}
      // DSFR tab overrides — kept here because `<Tabs>` is opaque through props.
      className="[&_.fr-tabs\_\_panel]:py-3! [&_.fr-tabs\_\_panel]:px-0! [&_.fr-tabs\_\_tab]:py-1! [&_.fr-tabs\_\_tab]:px-2! [&_.fr-tabs\_\_tab]:h-auto! [&_.fr-tabs\_\_tab]:font-normal!"

      // className="[&_.fr-tabs\_\_panel]:py-3! [&_.fr-tabs\_\_panel]:px-0! [&_.fr-tabs\_\_tab]:py-1! [&_.fr-tabs\_\_tab]:px-2! [&_.fr-tabs\_\_tab]:h-auto! [&_.fr-tabs\_\_tab]:font-normal! [&_.fr-collapse--expanded]:pl-3! [&_.fr-collapse--expanded]:pr-0! [&_.fr-collapse--expanded]:py-2! [&_.fr-collapse_.fr-checkbox-group]:py-1! [&_.fr-collapse_.fr-checkbox-group]:min-h-9!"
    >
      {selectedTabId === 'reseaux' && (
        <div className="flex flex-col gap-3 px-3">
          <div>
            <h2 className="text-base font-bold mb-1 text-(--text-title-grey)">Réseaux de chaleur et de froid</h2>
            <p className="text-xs text-(--text-mention-grey) mb-0">Cliquez sur un réseau pour connaître ses caractéristiques</p>
          </div>

          <div className="flex flex-col">
            <ReseauxDeChaleurLegend />
            <PerimetresDeDeveloppementPrioritaireLegend />
            <ReseauxEnConstructionLegend />
            <BatimentsRaccordesReseauxChaleurLegend />
            <Divider />
            <ReseauxDeFroidLegend />
            <BatimentsRaccordesReseauxFroidLegend />
          </div>

          <div className="flex flex-col items-stretch justify-center gap-2">
            <Link href="/contribution" className="fr-btn fr-btn--tertiary justify-center! w-full">
              <Icon name="fr-icon-heart-line" size="sm" className="mr-1" />
              Contribuer
            </Link>
            <Link
              href="https://www.data.gouv.fr/fr/datasets/traces-des-reseaux-de-chaleur-et-de-froid/"
              isExternal
              className="fr-btn fr-btn--tertiary justify-center! w-full"
            >
              Télécharger les tracés
            </Link>
          </div>

          <CallOut title="Vous êtes professionnel ?" variant="info" size="md" className="mt-3!" image="/icons/picto-compte-pro.svg">
            <ul>
              <li>Retrouvez vos listes d'adresses</li>
              <li>Comparez les coûts et les émissions de CO2</li>
            </ul>
            <Link href="/inscription" className="fr-btn fr-btn--primary">
              Créer un compte
            </Link>
          </CallOut>
        </div>
      )}

      {selectedTabId === 'potentiel' && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold mb-0 text-(--text-title-grey) px-3">Potentiel</h2>

          <div className="px-3">
            <DemandesEligibiliteLegend />
          </div>

          <LegendAccordion id="potentiel-batiments-conso" label="Bâtiments consommateurs gaz et fioul">
            <ConsommationsGazLegend />
            <BatimentsGazCollectifLegend />
            <BatimentsFioulCollectifLegend />
          </LegendAccordion>

          <LegendAccordion id="potentiel-batiments-besoins" label="Caractéristiques des bâtiments et besoins en chaleur et en froid">
            <BesoinsEnChaleurLegend />
            <BesoinsEnFroidLegend />
            <CaracteristiquesBatimentsLegend />
          </LegendAccordion>

          <LegendAccordion id="potentiel-territoire" label="Potentiel par territoire">
            <ZonesPotentielChaudLegend />
            <ZonesPotentielFroidLegend />
            <CommunesFortPotentielLegend />
            <ZonesAUrbaniserLegend />
            <BesoinsEnChaleurIndustrieCommunesLegend />
            <EtudesEnCoursLegend />
            <QuartiersPrioritairesLegend />
          </LegendAccordion>
        </div>
      )}

      {selectedTabId === 'enrr' && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold mb-0 text-(--text-title-grey) px-3">Énergies renouvelables et de récupération</h2>

          <LegendAccordion id="enrr-mobilisables" label="Mobilisables">
            <ChaleurFataleLegend />
            <ZonesGeothermieProfondeLegend />
            <RessourcesGeothermalesNappesLegend />
            <SolaireThermiqueLegend />
            <ThalassothermieLegend />
          </LegendAccordion>

          <LegendAccordion id="enrr-installations" label="Installations existantes">
            <GeothermieProfondeLegend />
            <GeothermieSurfaceEchangeursOuvertsLegend />
            <GeothermieSurfaceEchangeursFermesLegend />
          </LegendAccordion>
        </div>
      )}

      {selectedTabId === 'outils' && <ToolsTabContent />}
    </Tabs>
  );
}

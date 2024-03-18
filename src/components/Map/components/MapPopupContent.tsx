import Link from 'next/link';
import { getConso } from 'src/services/Map/conso';
import { DemandSummary } from 'src/types/Summary/Demand';
import { EnergySummary } from 'src/types/Summary/Energy';
import { FuturNetworkSummary } from 'src/types/Summary/FuturNetwork';
import { GasSummary } from 'src/types/Summary/Gas';
import { NetworkSummary } from 'src/types/Summary/Network';
import { RaccordementSummary } from 'src/types/Summary/Raccordement';
import { PopupTitle, PopupType } from '../Map.style';
import { isDefined } from '@utils/core';
import { ZonePotentielChaud } from 'src/types/layers/ZonePotentielChaud';
import { prettyFormatNumber } from '@utils/strings';
import { objTypeEnergy } from '../map-layers';
import { ReactElement } from 'react';
import {
  Datacenter,
  Industrie,
  InstallationElectrogene,
  StationDEpuration,
  UniteDIncineration,
} from 'src/types/layers/enrr_mobilisables';
import Text from '@components/ui/Text';

const writeTypeConso = (typeConso: string | unknown) => {
  switch (typeConso) {
    case 'R': {
      return 'Logement';
    }
    case 'T': {
      return 'Établissement tertiaire';
    }
    case 'I': {
      return 'Industrie';
    }
  }
  return '';
};

const formatBddText = (str?: string) => {
  return (
    str &&
    str
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/electricite/g, 'électricité')
      .replace(/reseau/g, 'réseau')
  );
};

const MapPopupContent = ({
  buildings,
  consommation,
  demands,
  energy,
  network,
  futurNetwork,
  raccordement,
}: {
  buildings?: EnergySummary;
  consommation?: GasSummary;
  energy?: EnergySummary;
  demands?: DemandSummary;
  network?: NetworkSummary;
  futurNetwork?: FuturNetworkSummary;
  raccordement?: RaccordementSummary;
}) => {
  const {
    nb_logements,
    annee_construction,
    type_usage,
    energie_utilisee: energie_utilisee_buildings,
    type_chauffage: type_chauffage_buildings,
    addr_label: addr_label_buildings,
    dpe_energie,
    dpe_ges,
  } = buildings || energy || {};
  const { adresse, nom_commun, code_grand, conso_nb } = consommation || {};
  const addr_label_consommation = adresse ? `${adresse} ${nom_commun}` : '';
  const {
    Adresse: addr_label_demands,
    'Mode de chauffage': mode_chauffage_demands,
    'Type de chauffage': type_chauffage_demands,
    Structure: structure,
  } = demands || {};
  const {
    ADRESSE: address_raccordement,
    CONSO: conso_raccordement,
    ID: id_raccordement,
  } = raccordement || {};

  const energie_utilisee = energie_utilisee_buildings || mode_chauffage_demands;
  const textAddress =
    addr_label_buildings ||
    addr_label_consommation ||
    addr_label_demands ||
    address_raccordement;
  const type_chauffage = type_chauffage_buildings || type_chauffage_demands;

  const displayNetwork =
    (network || futurNetwork) &&
    !(buildings || consommation || demands || energy);

  return (
    <>
      {textAddress && (
        <header>
          <h6>{textAddress}</h6>
        </header>
      )}
      <section>
        {code_grand && (
          <>
            <strong>
              <u>{writeTypeConso(code_grand)}</u>
            </strong>
            <br />
          </>
        )}
        {annee_construction && (
          <>
            <strong>Année de construction&nbsp;:</strong>&nbsp;
            {annee_construction}
            <br />
          </>
        )}
        {type_usage && (
          <>
            <strong>Usage&nbsp;:</strong>&nbsp;{type_usage}
            <br />
          </>
        )}
        {isDefined(nb_logements) && (
          <>
            <strong>Nombre de logements&nbsp;:</strong>&nbsp;{nb_logements}
            <br />
          </>
        )}
        {energie_utilisee && (
          <>
            <strong>Chauffage actuel&nbsp;:</strong>&nbsp;
            {formatBddText(energie_utilisee)}
            <br />
          </>
        )}
        {type_chauffage && (
          <>
            <strong>Mode de chauffage&nbsp;:</strong>&nbsp;{type_chauffage}
            <br />
          </>
        )}
        {conso_nb &&
          (!energie_utilisee ||
            objTypeEnergy?.gas.includes(energie_utilisee)) && (
            <>
              <strong>Conso. gaz&nbsp;:</strong>&nbsp;
              {conso_nb.toFixed(2)}
              &nbsp;MWh/an
              <br />
            </>
          )}
        {conso_raccordement && conso_raccordement !== 'secret' && (
          <>
            <strong>Consommation de chaleur&nbsp;:</strong>&nbsp;
            {conso_raccordement}
            &nbsp;MWh/an
            <br />
          </>
        )}
        {id_raccordement && !displayNetwork && (
          <>
            <strong>Identifiant&nbsp;:</strong>&nbsp;{id_raccordement}
          </>
        )}
        {dpe_energie && (
          <>
            <strong>DPE consommations énergétiques&nbsp;:</strong>&nbsp;
            {dpe_energie}
            <br />
          </>
        )}
        {dpe_ges && (
          <>
            <strong>DPE émissions de gaz à effet de serre&nbsp;:</strong>&nbsp;
            {dpe_ges}
            <br />
          </>
        )}
        {structure && (
          <>
            <strong>Structure&nbsp;:</strong>&nbsp;{structure}
            <br />
          </>
        )}
        {displayNetwork && network && (
          <>
            {network.nom_reseau && (
              <PopupTitle>{network.nom_reseau}</PopupTitle>
            )}
            <strong>Identifiant&nbsp;:</strong>&nbsp;
            {network['Identifiant reseau']
              ? network['Identifiant reseau']
              : 'Non connu'}
            <br />
            <strong>Gestionnaire&nbsp;:</strong>&nbsp;
            {network.Gestionnaire ? network.Gestionnaire : 'Non connu'}
            <br />
            {!network.isCold && (
              <>
                <strong>Taux EnR&R&nbsp;:</strong>&nbsp;
                {network['Taux EnR&R'] !== null &&
                network['Taux EnR&R'] !== undefined
                  ? network['Taux EnR&R'] + '%'
                  : 'Non connu'}
                <br />
              </>
            )}
            <strong>
              Contenu&nbsp;CO<sub>2</sub>&nbsp;ACV&nbsp;:
            </strong>
            &nbsp;
            {network['contenu CO2 ACV']
              ? Math.round(network['contenu CO2 ACV'] * 1000) + 'g/kWh'
              : 'Non connu'}
            <br />
            {network['Identifiant reseau'] && (
              <Link
                href={`/reseaux/${network['Identifiant reseau']}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Voir plus d'informations
              </Link>
            )}
          </>
        )}
        {displayNetwork && futurNetwork && (
          <>
            <strong>Gestionnaire&nbsp;:</strong>&nbsp;
            {futurNetwork.gestionnaire
              ? futurNetwork.gestionnaire
              : 'Non connu'}
            <br />
            <strong>Mise en service&nbsp;:</strong>&nbsp;
            {futurNetwork.mise_en_service
              ? futurNetwork.mise_en_service
              : 'Non connu'}
            <br />
          </>
        )}
      </section>
    </>
  );
};

export default MapPopupContent;

export const ViasevaPopupContent = ({
  network,
  futurNetwork,
}: {
  network?: NetworkSummary;
  futurNetwork?: FuturNetworkSummary;
}) => {
  return (
    <>
      {network ? (
        <section>
          {network.nom_reseau && <PopupTitle>{network.nom_reseau}</PopupTitle>}
          {!network.isCold && (
            <>
              <strong>Taux EnR&R&nbsp;:</strong>&nbsp;
              {network['Taux EnR&R'] !== null &&
              network['Taux EnR&R'] !== undefined
                ? network['Taux EnR&R'] + '%'
                : 'Non connu'}
              <br />
            </>
          )}
          <strong>
            Contenu&nbsp;CO<sub>2</sub>&nbsp;ACV&nbsp;:&nbsp;
          </strong>
          {network['contenu CO2 ACV']
            ? Math.round(network['contenu CO2 ACV'] * 1000) + 'g/kWh'
            : 'Non connu'}
          <br />
          <strong>
            Livraison totale de {network.isCold ? 'froid' : 'chaleur'}
            &nbsp;:&nbsp;
          </strong>
          {network.livraisons_totale_MWh
            ? `${getConso(network.livraisons_totale_MWh)}/an`
            : 'Non connu'}
          <br />
          <strong>Nombre de bâtiments raccordés&nbsp;:</strong>&nbsp;
          {network.nb_pdl ? network.nb_pdl : 'Non connu'}
          <br />
          {network['Identifiant reseau'] && (
            <a
              href={`/reseaux/${network['Identifiant reseau']}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir plus d'informations
            </a>
          )}
        </section>
      ) : (
        futurNetwork && (
          <section>
            <strong>Gestionnaire&nbsp;:</strong>&nbsp;
            {futurNetwork.gestionnaire
              ? futurNetwork.gestionnaire
              : 'Non connu'}
            <br />
            <strong>Mise en service&nbsp;:</strong>&nbsp;
            {futurNetwork.mise_en_service
              ? futurNetwork.mise_en_service
              : 'Non connu'}
          </section>
        )
      )}
    </>
  );
};

// use union types to get good typing
// be careful to use the LayerId in the 'type' property
export type DynamicPopupContentType =
  | ZonePotentielChaudPopupContentType
  | ENRRMobilisablePopupContentType;

type ZonePotentielChaudPopupContentType = {
  type: 'zonesPotentielChaud' | 'zonesPotentielFortChaud';
  properties: ZonePotentielChaud;
};

type ENRRMobilisablePopupContentType =
  | ENRRMobilisableDatacenterPopupContentType
  | ENRRMobilisableIndustriePopupContentType
  | ENRRMobilisableInstallationsElectrogenesPopupContentType
  | ENRRMobilisableStationsDEpurationPopupContentType
  | ENRRMobilisableUniteDIncinerationPopupContentType;

type ENRRMobilisableDatacenterPopupContentType = {
  type: 'enrrMobilisables-datacenter';
  properties: Datacenter;
};
type ENRRMobilisableIndustriePopupContentType = {
  type: 'enrrMobilisables-industrie';
  properties: Industrie;
};
type ENRRMobilisableInstallationsElectrogenesPopupContentType = {
  type: 'enrrMobilisables-installations-electrogenes';
  properties: InstallationElectrogene;
};
type ENRRMobilisableStationsDEpurationPopupContentType = {
  type: 'enrrMobilisables-stations-d-epuration';
  properties: StationDEpuration;
};
type ENRRMobilisableUniteDIncinerationPopupContentType = {
  type: 'enrrMobilisables-unites-d-incineration';
  properties: UniteDIncineration;
};

/**
 * Return the corresponding popup content depending on the content type
 */
export const DynamicPopupContent = ({
  content,
}: {
  content: DynamicPopupContentType;
}) => {
  switch (content.type) {
    case 'zonesPotentielChaud':
      return (
        <ZonePotentielChaudPopupContent
          zonePotentielChaud={content.properties}
        />
      );
    case 'zonesPotentielFortChaud':
      return (
        <ZonePotentielChaudPopupContent
          zonePotentielChaud={content.properties}
          fortChaud
        />
      );
    case 'enrrMobilisables-datacenter':
      return (
        <ENRRMobilisableDatacenterPopupContent
          datacenter={content.properties}
        />
      );
    case 'enrrMobilisables-industrie':
      return (
        <ENRRMobilisableIndustriePopupContent industrie={content.properties} />
      );
    case 'enrrMobilisables-installations-electrogenes':
      return (
        <ENRRMobilisableInstallationElectrogenePopupContent
          installationElectrogene={content.properties}
        />
      );
    case 'enrrMobilisables-stations-d-epuration':
      return (
        <ENRRMobilisableStationsDEpurationPopupContent
          stationDEpuration={content.properties}
        />
      );
    case 'enrrMobilisables-unites-d-incineration':
      return (
        <ENRRMobilisableUniteDIncinerationPopupContent
          uniteDIncineration={content.properties}
        />
      );
    default:
      throw new Error('not implemented');
  }
};

/**
 * Contenu de la popup pour les zones à potentiel chaud et fort chaud.
 */
const ZonePotentielChaudPopupContent = ({
  zonePotentielChaud,
  fortChaud,
}: {
  zonePotentielChaud: ZonePotentielChaud;
  fortChaud?: boolean;
}) => {
  return (
    <section>
      {zonePotentielChaud.ID_ZONE && (
        <PopupTitle className="fr-mr-3w">
          Zone à {fortChaud ? ' fort' : ''} potentiel
        </PopupTitle>
      )}
      <strong>Nombre de bâtiments “intéressants”&nbsp;:</strong>&nbsp;
      {isDefined(zonePotentielChaud.NBRE_BAT)
        ? zonePotentielChaud.NBRE_BAT
        : 'Non connu'}
      <br />
      <strong>Besoins en chauffage&nbsp;:</strong>&nbsp;
      {isDefined(zonePotentielChaud.CHAUF_MWH) ? (
        <>{formatMWh(zonePotentielChaud.CHAUF_MWH)}</>
      ) : (
        'Non connu'
      )}
      <br />
      <strong>Besoins en eau chaude sanitaire&nbsp;:</strong>&nbsp;
      {isDefined(zonePotentielChaud.ECS_MWH) ? (
        <>{formatMWh(zonePotentielChaud.ECS_MWH)}</>
      ) : (
        'Non connu'
      )}
      <br />
      <strong>Part du secteur tertiaire&nbsp;:</strong>&nbsp;
      {isDefined(zonePotentielChaud.PART_TER) ? (
        <>{prettyFormatNumber(zonePotentielChaud.PART_TER * 100, 2)}&nbsp;%</>
      ) : (
        'Non connu'
      )}
    </section>
  );
};

function formatMWh(value: number): ReactElement {
  let unit: string;

  if (value >= 1e6) {
    value /= 1e6;
    unit = 'TWh/an';
  } else if (value >= 1e3) {
    value /= 1e3;
    unit = 'GWh/an';
  } else {
    unit = 'MWh/an';
  }

  return (
    <>
      {value.toPrecision(3)}&nbsp;{unit}
    </>
  );
}

/**
 * Intervals:
 * - < 25 GWh
 * - [100;250 GWh[
 * - >= 2000 GWh
 */
function formatConsommation(value: string): string {
  switch (value[0]) {
    case '<': {
      const match = /< (\d+) GWh/.exec(value);
      return match ? `inférieure à ${match[1]} GWh/an` : value;
    }
    case '>': {
      const match = />= (\d+) GWh/.exec(value);
      return match ? `supérieure à ${match[1]} GWh/an` : value;
    }
    case '[': {
      const match = /\[(\d+);(\d+) GWh\[/.exec(value);
      return match ? `entre ${match[1]} et ${match[2]} GWh/an` : value;
    }
    default:
      // unknown
      return value;
  }
}

const ENRRMobilisableDatacenterPopupContent = ({
  datacenter,
}: {
  datacenter: Datacenter;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Datacenter</PopupType>
      <PopupTitle className="fr-mr-3w">{datacenter.nom}</PopupTitle>
      <PopupProperty label="Catégorie" value={datacenter.categorie} />
      <PopupProperty label="Commune" value={datacenter.com_nom} />
      <PopupProperty label="Identifiant national" value={datacenter.id} />
      <QualiteLabel value={datacenter.qualite_xy} />
    </section>
  );
};

const ENRRMobilisableIndustriePopupContent = ({
  industrie,
}: {
  industrie: Industrie;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Industrie</PopupType>
      <PopupTitle className="fr-mr-3w">{industrie.nom_site}</PopupTitle>
      <PopupProperty label="Activité" value={industrie.activite} />
      <PopupProperty label="Exploitant" value={industrie.exploitant} />
      <PopupProperty
        label="Consommation"
        value={industrie.conso}
        formatter={formatConsommation}
      />
      <PopupProperty
        label="Température des effluents majoritaires"
        value={industrie.t_major}
      />
      <PopupProperty
        label="Température des effluents minoritaires"
        value={industrie.t_minor}
      />
      <PopupProperty label="Commune" value={industrie.com_nom} />
      <QualiteLabel value={industrie.qualite_xy} />
    </section>
  );
};

const ENRRMobilisableInstallationElectrogenePopupContent = ({
  installationElectrogene,
}: {
  installationElectrogene: InstallationElectrogene;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Installation électrogène</PopupType>
      <PopupTitle className="fr-mr-3w">
        {installationElectrogene.nom_inst}
      </PopupTitle>
      <PopupProperty label="Type" value={installationElectrogene.type_inst} />
      <PopupProperty label="Commune" value={installationElectrogene.com_nom} />
      <QualiteLabel value={installationElectrogene.qualite_xy} />
    </section>
  );
};

const ENRRMobilisableStationsDEpurationPopupContent = ({
  stationDEpuration,
}: {
  stationDEpuration: StationDEpuration;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Station d'épuration</PopupType>
      <PopupTitle className="fr-mr-3w">{stationDEpuration.step_nom}</PopupTitle>
      <PopupProperty
        label="Débit entrant"
        value={stationDEpuration.debit_m3j}
        unit="m³/j"
      />
      <PopupProperty
        label="Capacité"
        value={stationDEpuration.capa_eh}
        unit="équivalent-habitants"
      />
      <PopupProperty label="Exploitant" value={stationDEpuration.exploitant} />
      <PopupProperty label="Commune" value={stationDEpuration.com_nom} />
    </section>
  );
};

const ENRRMobilisableUniteDIncinerationPopupContent = ({
  uniteDIncineration,
}: {
  uniteDIncineration: UniteDIncineration;
}) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Unité d'incinération</PopupType>
      <PopupTitle className="fr-mr-3w">
        {uniteDIncineration.nom_inst}
      </PopupTitle>
      <PopupProperty label="Type" value={uniteDIncineration.type_inst} />
      <PopupProperty label="Commune" value={uniteDIncineration.com_nom} />
      <QualiteLabel value={uniteDIncineration.qualite_xy} />
    </section>
  );
};

interface PopupPropertyProps<T> {
  label: string;
  value: T;
  unit?: string; // overridden by the formatter if present
  formatter?: (value: T) => string | ReactElement;
}
const PopupProperty = <T,>({
  label,
  value,
  unit,
  formatter,
}: PopupPropertyProps<T>) => (
  <>
    <strong>{label}&nbsp;:</strong>&nbsp;
    {isDefined(value)
      ? isDefined(formatter)
        ? formatter(value)
        : `${value} ${unit ?? ''}`
      : 'Non connu'}
    <br />
  </>
);

const qualiteToLabel = {
  1: '', // exact
  2: 'Localisation à la parcelle',
  3: 'Localisation au quartier',
  4: "Localisation à l'IRIS",
  5: 'Localisation à la commune',
} as const;

const QualiteLabel = ({ value }: { value: string | number }) => (
  <Text fontStyle="italic">
    {qualiteToLabel[`${value}`[0] as unknown as keyof typeof qualiteToLabel] ??
      ''}
  </Text>
);

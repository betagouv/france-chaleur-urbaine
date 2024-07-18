import { ReactElement } from 'react';

import Text from '@components/ui/Text';
import { isDefined } from '@utils/core';
import { formatMWh, prettyFormatNumber } from '@utils/strings';
import { BesoinsEnChaleur, BesoinsEnChaleurIndustrieCommunes } from 'src/types/layers/BesoinsEnChaleur';
import {
  Datacenter,
  Industrie,
  InstallationElectrogene,
  SolaireThermiqueFriche,
  SolaireThermiqueParking,
  StationDEpuration,
  UniteDIncineration,
} from 'src/types/layers/enrr_mobilisables';
import { ZonePotentielChaud } from 'src/types/layers/ZonePotentielChaud';

import { LayerId } from '../map-layers';
import { PopupTitle, PopupType } from '../Map.style';

export const layersWithDynamicContentPopup = [
  'zonesPotentielChaud',
  'zonesPotentielFortChaud',
  'enrrMobilisables-datacenter',
  'enrrMobilisables-industrie',
  'enrrMobilisables-installations-electrogenes',
  'enrrMobilisables-stations-d-epuration',
  'enrrMobilisables-unites-d-incineration',
  'enrrMobilisables-friches',
  'enrrMobilisables-parkings',
  'besoinsEnChaleur',
  'besoinsEnFroid',
  'besoinsEnChaleurIndustrieCommunes',
] as const satisfies ReadonlyArray<LayerId>;

export function isDynamicPopupContent(content: any): content is DynamicPopupContentType {
  return layersWithDynamicContentPopup.includes(content.type);
}

// use union types to get good typing
// be careful to use the LayerId in the 'type' property
export type DynamicPopupContentType =
  | ZonePotentielChaudPopupContentType
  | ENRRMobilisablePopupContentType
  | BesoinsEnChaleurPopupContentType
  | BesoinsEnChaleurIndustrieCommunesPopupContentType;

type BesoinsEnChaleurPopupContentType = {
  type: 'besoinsEnChaleur' | 'besoinsEnFroid';
  properties: BesoinsEnChaleur;
};

type BesoinsEnChaleurIndustrieCommunesPopupContentType = {
  type: 'besoinsEnChaleurIndustrieCommunes';
  properties: BesoinsEnChaleurIndustrieCommunes;
};

type ZonePotentielChaudPopupContentType = {
  type: 'zonesPotentielChaud' | 'zonesPotentielFortChaud';
  properties: ZonePotentielChaud;
};

type ENRRMobilisablePopupContentType =
  | ENRRMobilisableDatacenterPopupContentType
  | ENRRMobilisableIndustriePopupContentType
  | ENRRMobilisableInstallationsElectrogenesPopupContentType
  | ENRRMobilisableStationsDEpurationPopupContentType
  | ENRRMobilisableUniteDIncinerationPopupContentType
  | ENRRMobilisableFrichePopupContentType
  | ENRRMobilisableParkingPopupContentType;

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
type ENRRMobilisableFrichePopupContentType = {
  type: 'enrrMobilisables-friches';
  properties: SolaireThermiqueFriche;
};
type ENRRMobilisableParkingPopupContentType = {
  type: 'enrrMobilisables-parkings';
  properties: SolaireThermiqueParking;
};

/**
 * Return the corresponding popup content depending on the content type
 */
const DynamicPopupContent = ({ content }: { content: DynamicPopupContentType }) => {
  switch (content.type) {
    case 'zonesPotentielChaud':
      return <ZonePotentielChaudPopupContent zonePotentielChaud={content.properties} />;
    case 'zonesPotentielFortChaud':
      return <ZonePotentielChaudPopupContent zonePotentielChaud={content.properties} fortChaud />;
    case 'enrrMobilisables-datacenter':
      return <ENRRMobilisableDatacenterPopupContent datacenter={content.properties} />;
    case 'enrrMobilisables-industrie':
      return <ENRRMobilisableIndustriePopupContent industrie={content.properties} />;
    case 'enrrMobilisables-installations-electrogenes':
      return <ENRRMobilisableInstallationElectrogenePopupContent installationElectrogene={content.properties} />;
    case 'enrrMobilisables-stations-d-epuration':
      return <ENRRMobilisableStationsDEpurationPopupContent stationDEpuration={content.properties} />;
    case 'enrrMobilisables-unites-d-incineration':
      return <ENRRMobilisableUniteDIncinerationPopupContent uniteDIncineration={content.properties} />;
    case 'enrrMobilisables-friches':
      return <ENRRMobilisableSolaireThermiqueFrichePopupContent friche={content.properties} />;
    case 'enrrMobilisables-parkings':
      return <ENRRMobilisableSolaireThermiqueParkingPopupContent parking={content.properties} />;
    case 'besoinsEnChaleur':
    case 'besoinsEnFroid':
      return <BesoinsEnChaleurPopupContent besoinsEnChaleur={content.properties} />;
    case 'besoinsEnChaleurIndustrieCommunes':
      return <BesoinsEnChaleurIndustrieCommunesPopupContent besoinsEnChaleurIndustrieCommunes={content.properties} />;
    default:
      throw new Error('not implemented');
  }
};

export default DynamicPopupContent;

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
      <PopupTitle className="fr-mr-3w">Zone à {fortChaud ? ' fort' : ''} potentiel</PopupTitle>
      <PopupProperty label="Nombre de bâtiments “intéressants”" value={zonePotentielChaud.bat_imp} />
      <PopupProperty label="Besoins en chauffage" value={zonePotentielChaud.chauf_mwh} formatter={formatMWh} />
      <PopupProperty label="Besoins en eau chaude sanitaire" value={zonePotentielChaud.ecs_mwh} formatter={formatMWh} />
      <PopupProperty
        label="Part du secteur tertiaire"
        value={zonePotentielChaud.part_ter}
        formatter={(v) => <>{prettyFormatNumber(v * 100, 2)}&nbsp;%</>}
      />
      <PopupProperty label="Source" value="Cerema" />
    </section>
  );
};

/**
 * Contenu de la popup pour les besoins en chaleur et froid des bâtiments.
 */
const BesoinsEnChaleurPopupContent = ({ besoinsEnChaleur }: { besoinsEnChaleur: BesoinsEnChaleur }) => {
  return (
    <section>
      <PopupTitle className="fr-mr-3w">Besoins en chaleur et froid</PopupTitle>
      <PopupProperty label="Besoins en chauffage" value={besoinsEnChaleur.CHAUF_MWH} formatter={formatMWh} />
      <PopupProperty label="Besoins en eau chaude sanitaire" value={besoinsEnChaleur.ECS_MWH} formatter={formatMWh} />
      <PopupProperty label="Besoins en froid" value={besoinsEnChaleur.FROID_MWH} formatter={formatMWh} />
      <PopupProperty label="Part tertiaire de la surface des bâtiments" value={besoinsEnChaleur.PART_TER} unit="%" />
      <PopupProperty label="Surface de plancher" value={besoinsEnChaleur.SDP_M2} unit="m²" />
      <PopupProperty label="Identifiant BD TOPO" value={besoinsEnChaleur.IDBATIMENT} />
      <PopupProperty label="Source" value="Cerema" />
    </section>
  );
};

/**
 * Contenu de la popup pour les besoins en chaleur et froid des bâtiments.
 */
const BesoinsEnChaleurIndustrieCommunesPopupContent = ({
  besoinsEnChaleurIndustrieCommunes,
}: {
  besoinsEnChaleurIndustrieCommunes: BesoinsEnChaleurIndustrieCommunes;
}) => {
  return (
    <section>
      <PopupTitle className="fr-mr-3w">Besoins en chaleur du secteur industriel à {besoinsEnChaleurIndustrieCommunes.libgeo}</PopupTitle>
      <PopupProperty
        label="Besoin en chaleur et froid pour les process"
        value={besoinsEnChaleurIndustrieCommunes.conso_proc}
        formatter={formatMWh}
      />
      <PopupProperty
        label="Besoins en chaleur pour le chauffage des locaux"
        value={besoinsEnChaleurIndustrieCommunes.conso_loca}
        formatter={formatMWh}
      />
      <PopupProperty label="Autres besoins" value={besoinsEnChaleurIndustrieCommunes.conso_autr} formatter={formatMWh} />
      <PopupProperty label="Besoins totaux = tous usages" value={besoinsEnChaleurIndustrieCommunes.conso_tot} formatter={formatMWh} />
      <PopupProperty label="Source" value="Cerema" />
    </section>
  );
};

const ENRRMobilisableDatacenterPopupContent = ({ datacenter }: { datacenter: Datacenter }) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Datacenter</PopupType>
      <PopupTitle className="fr-mr-3w">{datacenter.nom}</PopupTitle>
      <PopupProperty label="Catégorie" value={datacenter.categorie} />
      <PopupProperty label="Commune" value={datacenter.com_nom} />
      <PopupProperty label="Identifiant national" value={datacenter.id} />
      <PopupProperty label="Source" value="Cerema" />
      <QualiteLabel value={datacenter.qualite_xy} />
    </section>
  );
};

const ENRRMobilisableIndustriePopupContent = ({ industrie }: { industrie: Industrie }) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Industrie</PopupType>
      <PopupTitle className="fr-mr-3w">{industrie.nom_etabli}</PopupTitle>
      <PopupProperty label="Activité" value={industrie.type_act} />
      <PopupProperty label="Potentiel minimal de chaleur valorisable (BT)" value={industrie.potbas_bt} unit="MWh/an" />
      <PopupProperty label="Potentiel maximale de chaleur valorisable (BT)" value={industrie.pothaut_bt} unit="MWh/an" />
      <PopupProperty label="Potentiel minimal de chaleur valorisable (HT)" value={industrie.potbas_ht} unit="MWh/an" />
      <PopupProperty label="Potentiel maximale de chaleur valorisable (HT)" value={industrie.pothaut_ht} unit="MWh/an" />
      <PopupProperty label="Source" value={industrie.source} />
      <QualiteLabel value={industrie.quali_xy} />
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
      <PopupTitle className="fr-mr-3w">{installationElectrogene.nom_inst}</PopupTitle>
      <PopupProperty label="Type" value={installationElectrogene.type_inst} />
      <PopupProperty label="Commune" value={installationElectrogene.com_nom} />
      <PopupProperty label="Source" value="Cerema" />
      <QualiteLabel value={installationElectrogene.qualite_xy} />
    </section>
  );
};

const ENRRMobilisableStationsDEpurationPopupContent = ({ stationDEpuration }: { stationDEpuration: StationDEpuration }) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Station d'épuration</PopupType>
      <PopupTitle className="fr-mr-3w">{stationDEpuration.step_nom}</PopupTitle>
      <PopupProperty label="Débit entrant" value={stationDEpuration.debit_m3j} unit="m³/j" />
      <PopupProperty label="Capacité" value={stationDEpuration.capa_eh} unit="équivalent-habitants" />
      <PopupProperty label="Exploitant" value={stationDEpuration.exploitant} />
      <PopupProperty label="Commune" value={stationDEpuration.com_nom} />
      <PopupProperty label="Source" value="Cerema" />
    </section>
  );
};

const ENRRMobilisableUniteDIncinerationPopupContent = ({ uniteDIncineration }: { uniteDIncineration: UniteDIncineration }) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Unité d'incinération</PopupType>
      <PopupTitle className="fr-mr-3w">{uniteDIncineration.nom_inst}</PopupTitle>
      <PopupProperty label="Type" value={uniteDIncineration.type_inst} />
      <PopupProperty label="Potentiel minimal de chaleur valorisable" value={uniteDIncineration.min_prd_cr} unit="MWh/an" />
      <PopupProperty label="Potentiel maximal de chaleur valorisable" value={uniteDIncineration.max_prd_cr} unit="MWh/an" />
      <PopupProperty label="Commune" value={uniteDIncineration.nom_comm} />
      <PopupProperty label="Source" value={uniteDIncineration.info} />
    </section>
  );
};

interface PopupPropertyProps<T> {
  label: string;
  value: T;
  unit?: string; // overridden by the formatter if present
  formatter?: (value: T) => string | ReactElement;
}
const PopupProperty = <T,>({ label, value, unit, formatter }: PopupPropertyProps<T>) => (
  <>
    <strong>{label}&nbsp;:</strong>&nbsp;
    {isDefined(value)
      ? isDefined(formatter)
        ? formatter(value)
        : `${typeof value === 'number' ? prettyFormatNumber(value) : value} ${unit ?? ''}`
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
  <Text fontStyle="italic">{qualiteToLabel[`${value}`[0] as unknown as keyof typeof qualiteToLabel] ?? ''}</Text>
);

const ENRRMobilisableSolaireThermiqueFrichePopupContent = ({ friche }: { friche: SolaireThermiqueFriche }) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Friche</PopupType>
      <PopupTitle className="fr-mr-3w">{friche.site_nom}</PopupTitle>
      <PopupProperty label="Surface" value={friche.surf_site} unit="m²" />
      <PopupProperty label="Source" value={friche.source_nom} />
    </section>
  );
};

const ENRRMobilisableSolaireThermiqueParkingPopupContent = ({ parking }: { parking: SolaireThermiqueParking }) => {
  return (
    <section>
      <PopupType className="fr-mr-3w">Parking</PopupType>
      <PopupProperty label="Surface" value={parking.surfm2} unit="m²" />
      <PopupProperty label="Source" value="Cerema" />
    </section>
  );
};
